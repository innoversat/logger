import { BaseFormat, FormatOptions } from './base.format';
import { LogEntry } from '../transports/base.transport';

/**
 * JSON format specific options
 */
export interface JsonFormatOptions extends FormatOptions {
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
 * JSON formatted log format
 */
export class JsonFormat extends BaseFormat {
  constructor(options: JsonFormatOptions = {}) {
    super(options);
    
    // Override options from the base class
    this.options = {
      ...this.options,
      indent: options.indent || 0,
      additionalFields: options.additionalFields || {},
      useUnixTimestamps: options.useUnixTimestamps || false,
      timestampKey: options.timestampKey || 'timestamp',
      levelKey: options.levelKey || 'level',
      messageKey: options.messageKey || 'message',
      metaKey: options.metaKey || 'meta',
      stackTraceKey: options.stackTraceKey || 'stackTrace'
    };
  }
  
  /**
   * Formats the log entry
   */
  format(entry: LogEntry): string {
    const options = this.options as JsonFormatOptions;
    const logObject: Record<string, any> = {
      ...options.additionalFields
    };
    
    // Timestamp
    if (options.showTimestamp) {
      const timestampKey = options.timestampKey || 'timestamp';
      if (options.useUnixTimestamps) {
        logObject[timestampKey] = new Date(entry.timestamp).getTime();
      } else {
        logObject[timestampKey] = entry.timestamp;
      }
    }
    
    // Log level
    if (options.showLevel) {
      const levelKey = options.levelKey || 'level';
      logObject[levelKey] = entry.level;
    }
    
    // Message
    const messageKey = options.messageKey || 'message';
    logObject[messageKey] = entry.message;
    
    // Metadata
    if (entry.meta && options.showMeta) {
      const metaKey = options.metaKey || 'meta';
      logObject[metaKey] = entry.meta;
    }
    
    // Stack trace
    if (entry.stackTrace) {
      const stackTraceKey = options.stackTraceKey || 'stackTrace';
      logObject[stackTraceKey] = entry.stackTrace;
    }
    
    return JSON.stringify(logObject, null, options.indent);
  }
} 