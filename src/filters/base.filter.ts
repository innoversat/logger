import { LogEntry } from '../transports/base.transport';
import { LogLevel } from '../log-level';

/**
 * Base interface for filter options
 */
export interface FilterOptions {
  /**
   * Filter by specific log level
   */
  level?: LogLevel;
  
  /**
   * Filter by specific log levels
   */
  levels?: LogLevel[];
  
  /**
   * Invert the filter
   * If true, non-matching log entries are accepted
   */
  negate?: boolean;
}

/**
 * Filter interface - determines whether log entries pass through
 */
export interface Filter {
  /**
   * Checks if a log entry should pass through the filter
   * 
   * @param entry Log entry
   * @returns true if entry is accepted, false if rejected
   */
  filter(entry: LogEntry): boolean;
}

/**
 * Base filter class
 */
export abstract class BaseFilter implements Filter {
  protected options: FilterOptions;
  
  constructor(options: FilterOptions = {}) {
    this.options = options;
  }
  
  /**
   * Filters by log level
   * 
   * @param level Log level to check
   * @returns true if log level is accepted
   */
  protected matchLevel(level: LogLevel): boolean {
    // If a specific level is defined
    if (this.options.level) {
      const result = level === this.options.level;
      return this.options.negate ? !result : result;
    }
    
    // If a list of levels is defined
    if (this.options.levels && this.options.levels.length > 0) {
      const result = this.options.levels.includes(level);
      return this.options.negate ? !result : result;
    }
    
    // If no level restrictions
    return true;
  }
  
  /**
   * Checks if a log entry should pass through the filter.
   * Must be implemented by subclasses.
   */
  abstract filter(entry: LogEntry): boolean;
} 