import 'colors';
import * as fs from 'fs';
import * as path from 'path';
import { LogLevel } from './log-level';
import { Transport, LogEntry, TransportOptions } from './transports/base.transport';
import { ConsoleTransport, ConsoleTransportOptions } from './transports/console.transport';
import { FileTransport, FileTransportOptions } from './transports/file.transport';

// Logger configuration options
export interface LoggerOptions {
  // General settings
  level?: LogLevel;
  transports?: Transport[];
  
  // Quick settings for default transports
  console?: boolean | ConsoleTransportOptions;
  file?: boolean | FileTransportOptions;
  
  // Formats and metadata
  includeTimestamp?: boolean;
  timestampFormat?: string;
  includeStackTrace?: boolean;
  stackTraceLimit?: number;
  
  // Application information
  appName?: string;
  environment?: 'development' | 'production' | 'test';
  
  // Performance
  asyncLogging?: boolean;
  logQueue?: number;
}

// Default options
const DEFAULT_OPTIONS: LoggerOptions = {
  level: LogLevel.DEBUG,
  console: true,
  file: false,
  includeTimestamp: true,
  timestampFormat: 'ISO',
  includeStackTrace: false,
  stackTraceLimit: 10,
  environment: 'development',
  asyncLogging: false,
  logQueue: 1000
};

export class Logger {
  private options: LoggerOptions;
  private transports: Transport[] = [];
  private queue: LogEntry[] = [];
  private isProcessingQueue: boolean = false;
  private isClosed: boolean = false;

  /**
   * Creates a new Logger
   */
  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Transports specified by user
    if (this.options.transports && this.options.transports.length > 0) {
      this.transports = [...this.options.transports];
    }
    
    // Add default transports (if specified)
    this.setupDefaultTransports();
  }
  
  /**
   * Configures default transports
   */
  private setupDefaultTransports(): void {
    // Console transport
    if (this.options.console) {
      const consoleOptions: ConsoleTransportOptions = typeof this.options.console === 'object' 
        ? { minLevel: this.options.level, ...this.options.console } 
        : { minLevel: this.options.level };
        
      this.transports.push(new ConsoleTransport(consoleOptions));
    }
    
    // File transport
    if (this.options.file) {
      const fileOptions: FileTransportOptions = typeof this.options.file === 'object'
        ? { minLevel: this.options.level, ...this.options.file }
        : {
            filename: `${this.options.appName || 'app'}.log`,
            directory: './logs',
            minLevel: this.options.level
          };
          
      this.transports.push(new FileTransport(fileOptions));
    }
  }
  
  /**
   * Creates a timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    if (this.options.timestampFormat === 'ISO') {
      return now.toISOString();
    } else if (this.options.timestampFormat === 'UNIX') {
      return now.getTime().toString();
    } else if (this.options.timestampFormat === 'LOCAL') {
      return now.toLocaleString();
    }
    return now.toISOString();
  }
  
  /**
   * Creates a stack trace
   */
  private getStackTrace(): string | undefined {
    if (!this.options.includeStackTrace) {
      return undefined;
    }
    
    const stackLimit = this.options.stackTraceLimit || 10;
    const obj = {};
    
    Error.captureStackTrace(obj, this.getStackTrace);
    return (obj as any).stack
      ?.split('\n')
      .slice(2, stackLimit + 2)
      .join('\n');
  }
  
  /**
   * Creates a log entry
   */
  private createLogEntry(level: LogLevel, message: string, meta?: any): LogEntry {
    return {
      timestamp: this.getTimestamp(),
      level,
      message,
      meta,
      stackTrace: (level === LogLevel.ERROR || level === LogLevel.FATAL) 
        ? this.getStackTrace() 
        : undefined,
    };
  }
  
  /**
   * Processes a log entry
   */
  private processLog(level: LogLevel, message: string, meta?: any): void {
    if (this.isClosed) {
      console.warn('Logger is closed: Message not processed');
      return;
    }
    
    // Create log entry
    const entry = this.createLogEntry(level, message, meta);
    
    // Add to queue if asynchronous logging is enabled
    if (this.options.asyncLogging) {
      this.enqueueLogEntry(entry);
    } else {
      // Process synchronously
      this.writeToTransports(entry);
    }
  }
  
  /**
   * Adds log entry to the queue
   */
  private enqueueLogEntry(entry: LogEntry): void {
    // Queue size check
    if (this.options.logQueue && this.queue.length >= this.options.logQueue) {
      this.queue.shift(); // Remove the oldest entry
    }
    
    this.queue.push(entry);
    
    // Start processing if the queue is not being processed
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }
  
  /**
   * Processes log entries in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.queue.length > 0) {
        const entry = this.queue.shift();
        if (entry) {
          await this.writeToTransports(entry);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
  
  /**
   * Writes log entry to all transports
   */
  private async writeToTransports(entry: LogEntry): Promise<void> {
    for (const transport of this.transports) {
      try {
        await transport.log(entry);
      } catch (error) {
        console.error('Transport write error:', error);
      }
    }
  }
  
  /**
   * Adds a new transport
   */
  public addTransport(transport: Transport): Logger {
    this.transports.push(transport);
    return this;
  }
  
  /**
   * Clears transports
   */
  public clearTransports(): Logger {
    for (const transport of this.transports) {
      if (typeof transport.close === 'function') {
        transport.close();
      }
    }
    this.transports = [];
    return this;
  }
  
  /**
   * Log at debug level
   */
  public debug(message: string, meta?: any): void {
    this.processLog(LogLevel.DEBUG, message, meta);
  }
  
  /**
   * Log at info level
   */
  public info(message: string, meta?: any): void {
    this.processLog(LogLevel.INFO, message, meta);
  }
  
  /**
   * Warn level log
   */
  public warn(message: string, meta?: any): void {
    this.processLog(LogLevel.WARN, message, meta);
  }
  
  /**
   * Error level log
   */
  public error(message: string, meta?: any): void {
    this.processLog(LogLevel.ERROR, message, meta);
  }
  
  /**
   * Fatal level log
   */
  public fatal(message: string, meta?: any): void {
    this.processLog(LogLevel.FATAL, message, meta);
  }
  
  /**
   * Creates a child logger
   */
  public child(options: {
    meta?: Record<string, any>;
    options?: Partial<LoggerOptions>;
  } = {}): Logger {
    const childOptions = { ...this.options, ...options.options };
    const childLogger = new Logger(childOptions);
    
    const meta = options.meta || {};
    
    // Adds metadata to all logs in the child logger
    return new Proxy(childLogger, {
      get(target: Record<string | symbol, any>, prop: string | symbol) {
        if (typeof target[prop] === 'function' && 
            ['debug', 'info', 'warn', 'error', 'fatal'].includes(String(prop))) {
          return function(message: string, additionalMeta?: any) {
            const combinedMeta = {
              ...meta,
              ...(additionalMeta || {})
            };
            return target[prop](message, combinedMeta);
          };
        }
        return target[prop];
      }
    }) as Logger;
  }
  
  /**
   * Closes the logger and cleans up all resources
   */
  public close(): Promise<void> {
    this.isClosed = true;
    
    // Process all remaining logs
    return new Promise<void>((resolve) => {
      const processRemainingLogs = async () => {
        if (this.queue.length > 0) {
          await this.processQueue();
          // Wait for the queue to be fully processed
          setTimeout(processRemainingLogs, 100);
        } else {
          // Close all transports
          for (const transport of this.transports) {
            if (typeof transport.close === 'function') {
              await transport.close();
            }
          }
          resolve();
        }
      };
      
      processRemainingLogs();
    });
  }
}

// Default logger instance
export const logger = new Logger();

interface Colors {
  gray: string;
  cyan: string;
  yellow: string;
  red: string;
  magenta: string;
} 