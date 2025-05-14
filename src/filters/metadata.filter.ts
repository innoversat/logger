import { BaseFilter, FilterOptions } from './base.filter';
import { LogEntry } from '../transports/base.transport';

/**
 * Options for metadata filter
 */
export interface MetadataFilterOptions extends FilterOptions {
  /**
   * Metadata key to check
   */
  key: string;
  
  /**
   * Value to match
   */
  value?: any;
  
  /**
   * Key name to match exactly
   * Checks for existence of the key, not its value
   */
  exists?: boolean;
  
  /**
   * If value is a string, whether to check for exact match or inclusion
   */
  exactMatch?: boolean;
  
  /**
   * Checks for matches with sub-properties instead of the entire metadata
   * E.g., for use with "user.id"
   */
  deepMatch?: boolean;
}

/**
 * Filters logs based on metadata information
 */
export class MetadataFilter extends BaseFilter {
  protected options: MetadataFilterOptions;
  
  constructor(options: MetadataFilterOptions) {
    super(options);
    
    if (!options.key && options.exists !== false) {
      throw new Error('Key must be specified for MetadataFilter');
    }
    
    // Type-safe assignment
    this.options = options;
  }
  
  /**
   * Filters log entry metadata
   */
  filter(entry: LogEntry): boolean {
    // First check log level
    if (!this.matchLevel(entry.level)) {
      return false;
    }
    
    // If no metadata and exists=false, we have a match
    if (!entry.meta) {
      return this.options.exists === false;
    }
    
    // Metadata existence check (if only existence matters)
    if (this.options.exists !== undefined && this.options.value === undefined) {
      const hasKey = this.options.deepMatch 
        ? this.hasDeepProperty(entry.meta, this.options.key)
        : this.options.key in entry.meta;
      
      return this.options.negate ? !hasKey : hasKey;
    }
    
    // Value comparison
    let actualValue;
    
    if (this.options.deepMatch) {
      actualValue = this.getDeepProperty(entry.meta, this.options.key);
    } else {
      actualValue = entry.meta[this.options.key];
    }
    
    // Value check
    if (actualValue === undefined) {
      return false;
    }
    
    // String comparison
    if (typeof actualValue === 'string' && typeof this.options.value === 'string' && !this.options.exactMatch) {
      const result = actualValue.includes(this.options.value);
      return this.options.negate ? !result : result;
    }
    
    // Exact match
    const result = actualValue === this.options.value;
    return this.options.negate ? !result : result;
  }
  
  /**
   * Provides access to deep properties
   * E.g., for use with "user.profile.id"
   */
  private getDeepProperty(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }
  
  /**
   * Checks existence of deep properties
   */
  private hasDeepProperty(obj: any, path: string): boolean {
    return this.getDeepProperty(obj, path) !== undefined;
  }
} 