import { BaseFilter, FilterOptions } from './base.filter';
import { LogEntry } from '../transports/base.transport';

/**
 * Filters logs by log level
 */
export class LevelFilter extends BaseFilter {
  /**
   * Checks if a log entry passes the filter based on specified level
   */
  filter(entry: LogEntry): boolean {
    return this.matchLevel(entry.level);
  }
} 