import * as fs from 'fs';
import * as path from 'path';
import { BaseTransport, LogEntry, TransportOptions } from './base.transport';
import { LogLevel } from '../log-level';

/**
 * File transport specific options
 */
export interface FileTransportOptions extends TransportOptions {
  /**
   * Path to the log file
   */
  filename: string;
  
  /**
   * Log directory (combined with filename if specified)
   */
  directory?: string;
  
  /**
   * File open mode ('a' - append, 'w' - write)
   */
  mode?: 'a' | 'w';
  
  /**
   * Maximum file size for rotation (bytes)
   */
  maxSize?: number;
  
  /**
   * Maximum number of files to keep
   */
  maxFiles?: number;
  
  /**
   * Time-based file rotation (hourly, daily, etc.)
   */
  datePattern?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  
  /**
   * Log content format
   */
  format?: 'json' | 'text';
}

/**
 * Transport for writing logs to a file
 */
export class FileTransport extends BaseTransport {
  protected options: FileTransportOptions;
  private currentSize: number = 0;
  private currentFilePath: string;
  private writeStream: fs.WriteStream | null = null;
  private lastRotationCheck: number = Date.now();
  private rotationCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(options: FileTransportOptions) {
    super(options);
    
    if (!options.filename) {
      throw new Error('Filename must be specified for FileTransport');
    }
    
    // Set default values
    this.options = {
      mode: 'a',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: 'text',
      ...options
    };
    
    // Create file path
    this.currentFilePath = this.getFilePath();
    
    // Create log directory
    this.ensureDirectoryExists();
    
    // Check file size
    this.checkFileSize();
    
    // Create file write stream
    this.createWriteStream();
    
    // Date-based rotation check period
    if (this.options.datePattern) {
      const checkInterval = this.getCheckIntervalFromPattern();
      this.rotationCheckInterval = setInterval(() => {
        this.checkTimeRotation();
      }, checkInterval);
    }
  }
  
  /**
   * Writes log message to the file
   */
  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    // Recreate write stream if missing
    if (!this.writeStream) {
      this.createWriteStream();
    }
    
    // Determine log format
    let logString = '';
    if (this.options.format === 'json') {
      logString = JSON.stringify(entry) + '\n';
    } else {
      // Text format
      logString = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
      if (entry.meta) {
        logString += ` ${JSON.stringify(entry.meta)}`;
      }
      if (entry.stackTrace) {
        logString += `\n${entry.stackTrace}`;
      }
      logString += '\n';
    }
    
    // Write to file
    this.writeStream?.write(logString, 'utf8', err => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        // Successful write, update size
        this.currentSize += Buffer.byteLength(logString, 'utf8');
        
        // Size check
        if (this.options.maxSize && this.currentSize >= this.options.maxSize) {
          this.rotateFile();
        }
      }
    });
  }
  
  /**
   * Creates the file path
   */
  private getFilePath(): string {
    const dir = this.options.directory || '';
    return dir ? path.join(dir, this.options.filename) : this.options.filename;
  }
  
  /**
   * Checks if directory exists, creates it if not
   */
  private ensureDirectoryExists(): void {
    if (this.options.directory && !fs.existsSync(this.options.directory)) {
      fs.mkdirSync(this.options.directory, { recursive: true });
    }
  }
  
  /**
   * Checks the file size
   */
  private checkFileSize(): void {
    try {
      if (fs.existsSync(this.currentFilePath)) {
        const stats = fs.statSync(this.currentFilePath);
        this.currentSize = stats.size;
        
        // Size check
        if (this.options.maxSize && this.currentSize >= this.options.maxSize) {
          this.rotateFile();
        }
      } else {
        this.currentSize = 0;
      }
    } catch (error) {
      console.error('Error checking file size:', error);
      this.currentSize = 0;
    }
  }
  
  /**
   * Creates the file write stream
   */
  private createWriteStream(): void {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
    
    try {
      this.writeStream = fs.createWriteStream(this.currentFilePath, {
        flags: this.options.mode,
        encoding: 'utf8'
      });
      
      this.writeStream.on('error', error => {
        console.error('File write error:', error);
        this.writeStream = null;
      });
    } catch (error) {
      console.error('Error creating file write stream:', error);
    }
  }
  
  /**
   * Performs file rotation
   */
  private rotateFile(): void {
    if (!this.writeStream) return;
    
    this.writeStream.end();
    this.writeStream = null;
    
    // Scan and rename old files
    this.renameOldFiles();
    
    // Create new write stream
    this.currentSize = 0;
    this.createWriteStream();
  }
  
  /**
   * Renames old files
   */
  private renameOldFiles(): void {
    try {
      // Separate base name and extension
      const ext = path.extname(this.currentFilePath);
      const basePath = this.currentFilePath.slice(0, -ext.length);
      
      // Delete oldest file (if maxFiles is exceeded)
      const maxIndex = this.options.maxFiles || 5;
      const oldestFile = `${basePath}.${maxIndex}${ext}`;
      if (fs.existsSync(oldestFile)) {
        fs.unlinkSync(oldestFile);
      }
      
      // Shift other files up one index
      for (let i = maxIndex - 1; i >= 1; i--) {
        const oldFile = `${basePath}.${i}${ext}`;
        const newFile = `${basePath}.${i + 1}${ext}`;
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      
      // Rename current file to .1
      fs.renameSync(this.currentFilePath, `${basePath}.1${ext}`);
    } catch (error) {
      console.error('Error during file rotation:', error);
    }
  }
  
  /**
   * Checks for time-based rotation
   */
  private checkTimeRotation(): void {
    const now = Date.now();
    
    if (this.shouldRotateByTime(now)) {
      this.lastRotationCheck = now;
      this.rotateFile();
    }
  }
  
  /**
   * Determines whether to rotate based on time
   */
  private shouldRotateByTime(now: number): boolean {
    if (!this.options.datePattern) return false;
    
    const lastDate = new Date(this.lastRotationCheck);
    const currentDate = new Date(now);
    
    switch (this.options.datePattern) {
      case 'hourly':
        return lastDate.getHours() !== currentDate.getHours() ||
               lastDate.getDate() !== currentDate.getDate() ||
               lastDate.getMonth() !== currentDate.getMonth() ||
               lastDate.getFullYear() !== currentDate.getFullYear();
      
      case 'daily':
        return lastDate.getDate() !== currentDate.getDate() ||
               lastDate.getMonth() !== currentDate.getMonth() ||
               lastDate.getFullYear() !== currentDate.getFullYear();
      
      case 'weekly':
        const lastDay = Math.floor(lastDate.getTime() / (24 * 60 * 60 * 1000));
        const currentDay = Math.floor(currentDate.getTime() / (24 * 60 * 60 * 1000));
        return Math.floor(lastDay / 7) !== Math.floor(currentDay / 7);
      
      case 'monthly':
        return lastDate.getMonth() !== currentDate.getMonth() ||
               lastDate.getFullYear() !== currentDate.getFullYear();
      
      default:
        return false;
    }
  }
  
  /**
   * Gets check interval from date pattern
   */
  private getCheckIntervalFromPattern(): number {
    switch (this.options.datePattern) {
      case 'hourly':
        return 15 * 60 * 1000; // 15 minutes
      case 'daily':
        return 60 * 60 * 1000; // 1 hour
      case 'weekly':
      case 'monthly':
        return 6 * 60 * 60 * 1000; // 6 hours
      default:
        return 60 * 60 * 1000; // 1 hour by default
    }
  }
  
  /**
   * Closes the transport
   */
  close(): void {
    if (this.rotationCheckInterval) {
      clearInterval(this.rotationCheckInterval);
      this.rotationCheckInterval = null;
    }
    
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }
} 