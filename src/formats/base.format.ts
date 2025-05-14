import { LogEntry } from '../transports/base.transport';

/**
 * Format options interface
 */
export interface FormatOptions {
  /**
   * Whether to show timestamp
   */
  showTimestamp?: boolean;
  
  /**
   * Timestamp format
   */
  timestampFormat?: 'ISO' | 'UNIX' | 'LOCAL' | string;
  
  /**
   * Custom configurations for timestamp formats
   */
  dateFormatOptions?: Intl.DateTimeFormatOptions;
  
  /**
   * Whether to show log level
   */
  showLevel?: boolean;
  
  /**
   * Whether to show metadata
   */
  showMeta?: boolean;
  
  /**
   * Metadata format (json, inspect, etc.)
   */
  metaFormat?: 'json' | 'inspect';
  
  /**
   * Custom settings for JSON.stringify
   */
  jsonIndent?: number;
  
  // SimpleFormat properties
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
  
  // JsonFormat properties
  /**
   * JSON indentation level
   */
  indent?: number;
  
  /**
   * Additional fields to add to the log
   */
  additionalFields?: Record<string, any>;
  
  /**
   * Use unix timestamps for dates
   */
  useUnixTimestamps?: boolean;
  
  /**
   * Timestamp field name
   */
  timestampKey?: string;
  
  /**
   * Level field name
   */
  levelKey?: string;
  
  /**
   * Message field name
   */
  messageKey?: string;
  
  /**
   * Metadata field name
   */
  metaKey?: string;
  
  /**
   * Stack trace field name
   */
  stackTraceKey?: string;
}

/**
 * Format interface
 */
export interface Format {
  /**
   * Formats the log entry
   */
  format(entry: LogEntry): string;
}

/**
 * Base format class
 */
export abstract class BaseFormat implements Format {
  protected options: FormatOptions;
  
  constructor(options: FormatOptions = {}) {
    this.options = {
      showTimestamp: true,
      timestampFormat: 'ISO',
      showLevel: true,
      showMeta: true,
      metaFormat: 'json',
      jsonIndent: 0,
      ...options
    };
  }
  
  /**
   * Formats the timestamp
   */
  protected formatTimestamp(timestamp: string): string {
    if (!this.options.showTimestamp) {
      return '';
    }
    
    try {
      const date = new Date(timestamp);
      
      switch (this.options.timestampFormat) {
        case 'ISO':
          return date.toISOString();
        case 'UNIX':
          return date.getTime().toString();
        case 'LOCAL':
          return date.toLocaleString();
        default:
          // Custom format
          if (this.options.dateFormatOptions) {
            return date.toLocaleString(undefined, this.options.dateFormatOptions);
          }
          return date.toISOString();
      }
    } catch (error) {
      return timestamp;
    }
  }
  
  /**
   * Formats the metadata
   */
  protected formatMeta(meta: any): string {
    if (!meta || !this.options.showMeta) {
      return '';
    }
    
    try {
      if (this.options.metaFormat === 'inspect') {
        const util = require('util');
        return util.inspect(meta, { depth: null });
      }
      
      // Default: JSON
      return JSON.stringify(meta, null, this.options.jsonIndent);
    } catch (error) {
      return String(meta);
    }
  }
  
  /**
   * Formats the stack trace
   */
  protected formatStackTrace(stackTrace?: string): string {
    if (!stackTrace) {
      return '';
    }
    return stackTrace;
  }
  
  /**
   * Formats the log level
   */
  protected formatLevel(level: string): string {
    if (!this.options.showLevel) {
      return '';
    }
    return level.toUpperCase();
  }
  
  /**
   * Formats the log entry. Must be implemented by subclasses.
   */
  abstract format(entry: LogEntry): string;
} 