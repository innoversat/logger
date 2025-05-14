import 'colors';
import { BaseTransport, LogEntry, TransportOptions } from './base.transport';
import { LogLevel } from '../log-level';

/**
 * Console transport specific options
 */
export interface ConsoleTransportOptions extends TransportOptions {
  /**
   * Enable/disable colorization
   */
  colorize?: boolean;
  
  /**
   * Show/hide timestamp
   */
  showTimestamp?: boolean;
  
  /**
   * Show/hide log level
   */
  showLevel?: boolean;
  
  /**
   * Colors for each log level
   */
  levelColors?: Record<LogLevel, keyof Colors>;
  
  /**
   * Log output format
   */
  format?: 'simple' | 'json' | 'detailed';
}

/**
 * Transport that writes log messages to the console
 */
export class ConsoleTransport extends BaseTransport {
  protected options: ConsoleTransportOptions;
  
  // Default colors for each log level
  private static readonly DEFAULT_COLORS: Record<LogLevel, keyof Colors> = {
    [LogLevel.DEBUG]: 'gray',
    [LogLevel.INFO]: 'cyan',
    [LogLevel.WARN]: 'yellow',
    [LogLevel.ERROR]: 'red',
    [LogLevel.FATAL]: 'magenta'
  };
  
  constructor(options: ConsoleTransportOptions = {}) {
    super(options);
    
    // Set default values
    this.options = {
      colorize: true,
      showTimestamp: true,
      showLevel: true,
      format: 'simple',
      levelColors: ConsoleTransport.DEFAULT_COLORS,
      ...options
    };
  }
  
  /**
   * Print log message to the console
   */
  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    let logOutput: string;
    
    switch (this.options.format) {
      case 'json':
        logOutput = JSON.stringify(entry);
        break;
        
      case 'detailed':
        logOutput = this.formatDetailed(entry);
        break;
      
      case 'simple':
      default:
        logOutput = this.formatSimple(entry);
        break;
    }
    
    if (this.options.colorize) {
      const colorMethod = this.getColorForLevel(entry.level);
      console.log((logOutput as any)[colorMethod]);
    } else {
      console.log(logOutput);
    }
  }
  
  /**
   * Format message with simple format
   */
  private formatSimple(entry: LogEntry): string {
    let message = '';
    
    // Timestamp
    if (this.options.showTimestamp) {
      message += `[${entry.timestamp}] `;
    }
    
    // Log level
    if (this.options.showLevel) {
      message += `[${entry.level.toUpperCase()}] `;
    }
    
    // Message
    message += entry.message;
    
    // Metadata
    if (entry.meta) {
      message += ` ${JSON.stringify(entry.meta)}`;
    }
    
    // Stack trace
    if (entry.stackTrace) {
      message += `\n${entry.stackTrace}`;
    }
    
    return message;
  }
  
  /**
   * Format message with detailed format
   */
  private formatDetailed(entry: LogEntry): string {
    const parts = [];
    
    // Timestamp
    if (this.options.showTimestamp) {
      parts.push(`TIME: ${entry.timestamp}`);
    }
    
    // Log level
    if (this.options.showLevel) {
      parts.push(`LEVEL: ${entry.level.toUpperCase()}`);
    }
    
    // Message
    parts.push(`MESSAGE: ${entry.message}`);
    
    // Metadata
    if (entry.meta) {
      parts.push(`META: ${JSON.stringify(entry.meta, null, 2)}`);
    }
    
    // Stack trace
    if (entry.stackTrace) {
      parts.push(`STACK TRACE:\n${entry.stackTrace}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * Get color for log level
   */
  private getColorForLevel(level: LogLevel): keyof Colors {
    return this.options.levelColors?.[level] || ConsoleTransport.DEFAULT_COLORS[level];
  }
}

/**
 * Type definition for Colors module
 */
interface Colors {
  reset: string;
  bold: string;
  dim: string;
  italic: string;
  underline: string;
  inverse: string;
  hidden: string;
  strikethrough: string;
  
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  gray: string;
  grey: string;
  
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
  
  bgBlack: string;
  bgRed: string;
  bgGreen: string;
  bgYellow: string;
  bgBlue: string;
  bgMagenta: string;
  bgCyan: string;
  bgWhite: string;
  bgGray: string;
  bgGrey: string;
  
  bgBrightRed: string;
  bgBrightGreen: string;
  bgBrightYellow: string;
  bgBrightBlue: string;
  bgBrightMagenta: string;
  bgBrightCyan: string;
  bgBrightWhite: string;
} 