import { LogLevel } from '../log-level';

/**
 * Interface for log entry content
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
  stackTrace?: string;
}

/**
 * Base interface for all transport classes
 */
export interface Transport {
  /**
   * Processes the log entry and sends it to the destination
   */
  log(entry: LogEntry): Promise<void> | void;
  
  /**
   * Closes transport resources (connections, file handles, etc.)
   */
  close?(): Promise<void> | void;
}

/**
 * Base interface for transport configuration options
 */
export interface TransportOptions {
  /**
   * Minimum log level
   */
  minLevel?: LogLevel;
}

/**
 * Base class for all transports
 */
export abstract class BaseTransport implements Transport {
  protected options: TransportOptions;
  
  constructor(options: TransportOptions = {}) {
    this.options = options;
  }
  
  /**
   * Checks if the log level meets the minimum level requirement
   */
  protected shouldLog(level: LogLevel): boolean {
    if (!this.options.minLevel) return true;
    
    const levels = Object.values(LogLevel);
    const minLevelIndex = levels.indexOf(this.options.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * Processes the log entry. Must be implemented by subclasses.
   */
  abstract log(entry: LogEntry): Promise<void> | void;
} 