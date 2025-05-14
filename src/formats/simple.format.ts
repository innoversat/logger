import { BaseFormat, FormatOptions } from './base.format';
import { LogEntry } from '../transports/base.transport';

/**
 * Simple format specific options
 */
export interface SimpleFormatOptions extends FormatOptions {
  /**
   * Separator for timestamp format
   */
  timestampSeparator?: string;
  
  /**
   * Separator for level format
   */
  levelSeparator?: string;
  
  /**
   * Separator for metadata
   */
  metaSeparator?: string;
  
  /**
   * Separator for stack trace
   */
  stackTraceSeparator?: string;
}

/**
 * Simple formatted log format
 */
export class SimpleFormat extends BaseFormat {
  constructor(options: SimpleFormatOptions = {}) {
    super(options);
    
    // Override options from the base class
    this.options = {
      ...this.options,
      timestampSeparator: options.timestampSeparator || ' ',
      levelSeparator: options.levelSeparator || ' ',
      metaSeparator: options.metaSeparator || ' ',
      stackTraceSeparator: options.stackTraceSeparator || '\n'
    };
  }
  
  /**
   * Formats the log entry
   */
  format(entry: LogEntry): string {
    let result = '';
    const options = this.options as SimpleFormatOptions;
    
    // Timestamp
    const timestamp = this.formatTimestamp(entry.timestamp);
    if (timestamp) {
      result += `[${timestamp}]${options.timestampSeparator}`;
    }
    
    // Log level
    const level = this.formatLevel(entry.level);
    if (level) {
      result += `[${level}]${options.levelSeparator}`;
    }
    
    // Message
    result += entry.message;
    
    // Metadata
    const meta = this.formatMeta(entry.meta);
    if (meta) {
      result += `${options.metaSeparator}${meta}`;
    }
    
    // Stack trace
    const stackTrace = this.formatStackTrace(entry.stackTrace);
    if (stackTrace) {
      result += `${options.stackTraceSeparator}${stackTrace}`;
    }
    
    return result;
  }
} 