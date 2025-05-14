import { BaseTransport, LogEntry, TransportOptions } from './base.transport';
import { LogLevel } from '../log-level';
import fetch from 'node-fetch';

/**
 * Configuration options for HTTP transport
 */
export interface HttpTransportOptions extends TransportOptions {
  /**
   * Endpoint URL where logs will be sent
   */
  url: string;
  
  /**
   * Headers to be sent with HTTP request
   */
  headers?: Record<string, string>;
  
  /**
   * Number of retry attempts when logging fails
   */
  retryCount?: number;
  
  /**
   * Delay between retry attempts (ms)
   */
  retryDelay?: number;
  
  /**
   * Send logs in batches
   */
  batchLogs?: boolean;
  
  /**
   * Maximum number of logs for batch sending
   */
  batchSize?: number;
  
  /**
   * Maximum wait time for batch log sending (ms)
   */
  batchTimeout?: number;
}

/**
 * Transport that sends logs to REST API via HTTP POST requests
 */
export class HttpTransport extends BaseTransport {
  protected options: HttpTransportOptions;
  private logQueue: LogEntry[] = [];
  private batchTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(options: HttpTransportOptions) {
    super(options);
    
    // Set default values
    this.options = {
      retryCount: 3,
      retryDelay: 1000,
      batchLogs: false,
      batchSize: 10,
      batchTimeout: 5000,
      ...options
    };
    
    // Check HTTP URL
    if (!this.options.url) {
      throw new Error('URL must be specified for HttpTransport');
    }
    
    // Start timeout if in batch mode
    if (this.options.batchLogs) {
      this.scheduleBatch();
    }
  }
  
  /**
   * Processes log entry and sends it to HTTP endpoint
   */
  log(entry: LogEntry): Promise<void> | void {
    // Check log level
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    // Add to queue if batch sending is active
    if (this.options.batchLogs) {
      this.logQueue.push(entry);
      
      // Send immediately if queue size exceeds limit
      if (this.logQueue.length >= (this.options.batchSize || 10)) {
        this.sendBatch();
      }
      
      return;
    }
    
    // Single log sending
    return this.sendLog(entry);
  }
  
  /**
   * Sends a single log entry to HTTP endpoint
   */
  private async sendLog(entry: LogEntry, retryAttempt = 0): Promise<void> {
    try {
      const response = await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers
        },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.error('HTTP transport log sending failed:', error);
      
      // Retry mechanism
      if (retryAttempt < (this.options.retryCount || 0)) {
        await new Promise(resolve => 
          setTimeout(resolve, this.options.retryDelay || 1000)
        );
        return this.sendLog(entry, retryAttempt + 1);
      }
    }
  }
  
  /**
   * Sends all logs in the queue as a batch
   */
  private async sendBatch(): Promise<void> {
    if (this.logQueue.length === 0) return;
    
    // Get logs from queue and clear the queue
    const batch = [...this.logQueue];
    this.logQueue = [];
    
    try {
      const response = await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers
        },
        body: JSON.stringify(batch)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP batch error: ${response.status}`);
      }
    } catch (error) {
      console.error('HTTP transport batch sending failed:', error);
      
      // Add logs back to queue if failed
      this.logQueue = [...batch, ...this.logQueue];
    }
    
    // Schedule a new batch timeout
    this.scheduleBatch();
  }
  
  /**
   * Schedules the next batch sending
   */
  private scheduleBatch(): void {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
    }
    
    this.batchTimeoutId = setTimeout(() => {
      this.sendBatch();
    }, this.options.batchTimeout || 5000);
  }
  
  /**
   * Cleans up resources
   */
  async close(): Promise<void> {
    // Send pending batch immediately if exists
    if (this.options.batchLogs && this.logQueue.length > 0) {
      await this.sendBatch();
    }
    
    // Clear timeout
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
  }
} 