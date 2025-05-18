import { LogLevel } from '../log-level';
import { LogEntry } from '../transports/base.transport';
import { SimpleFormat } from '../formats/simple.format';
import { JsonFormat } from '../formats/json.format';

describe('SimpleFormat', () => {
  const sampleEntry: LogEntry = {
    timestamp: '2023-01-01T12:00:00.000Z',
    level: LogLevel.INFO,
    message: 'Test message',
    meta: { user: 'test-user' },
    stackTrace: 'Error: Test error\n    at TestFunction'
  };

  it('should format log entries with default options', () => {
    const format = new SimpleFormat();
    const result = format.format(sampleEntry);
    
    expect(result).toContain('[2023-01-01T12:00:00.000Z]');
    expect(result).toContain('[INFO]');
    expect(result).toContain('Test message');
    expect(result).toContain(JSON.stringify(sampleEntry.meta));
    expect(result).toContain(sampleEntry.stackTrace);
  });

  it('should respect showTimestamp option', () => {
    const format = new SimpleFormat({ showTimestamp: false });
    const result = format.format(sampleEntry);
    
    expect(result).not.toContain('[2023-01-01T12:00:00.000Z]');
    expect(result).toContain('[INFO]');
  });

  it('should respect showLevel option', () => {
    const format = new SimpleFormat({ showLevel: false });
    const result = format.format(sampleEntry);
    
    expect(result).toContain('[2023-01-01T12:00:00.000Z]');
    expect(result).not.toContain('[INFO]');
  });

  it('should use custom separators', () => {
    const format = new SimpleFormat({
      timestampSeparator: ' | ',
      levelSeparator: ' > ',
      metaSeparator: ' :: '
    });
    const result = format.format(sampleEntry);
    
    expect(result).toContain('] | ');
    expect(result).toContain('] > ');
    expect(result).toContain(' :: {');
  });

  it('should format timestamps according to format option', () => {
    const format = new SimpleFormat({
      timestampFormat: 'LOCAL',
      dateFormatOptions: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    });
    const result = format.format(sampleEntry);
    
    // The exact output depends on the locale, but should be a date
    expect(result).toMatch(/\[\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4}/);
  });
});

describe('JsonFormat', () => {
  const sampleEntry: LogEntry = {
    timestamp: '2023-01-01T12:00:00.000Z',
    level: LogLevel.ERROR,
    message: 'Error message',
    meta: { code: 500, path: '/api/test' },
    stackTrace: 'Error: Test error\n    at TestFunction'
  };

  it('should format log entries with default options', () => {
    const format = new JsonFormat();
    const result = format.format(sampleEntry);
    
    const parsed = JSON.parse(result);
    expect(parsed.timestamp).toBe(sampleEntry.timestamp);
    expect(parsed.level).toBe(sampleEntry.level);
    expect(parsed.message).toBe(sampleEntry.message);
    expect(parsed.meta).toEqual(sampleEntry.meta);
    expect(parsed.stackTrace).toBe(sampleEntry.stackTrace);
  });

  it('should respect custom field names', () => {
    const format = new JsonFormat({
      timestampKey: '@timestamp',
      levelKey: 'log_level',
      messageKey: 'log_message',
      metaKey: 'metadata',
      stackTraceKey: 'trace'
    });
    
    const result = format.format(sampleEntry);
    const parsed = JSON.parse(result);
    
    expect(parsed['@timestamp']).toBe(sampleEntry.timestamp);
    expect(parsed.log_level).toBe(sampleEntry.level);
    expect(parsed.log_message).toBe(sampleEntry.message);
    expect(parsed.metadata).toEqual(sampleEntry.meta);
    expect(parsed.trace).toBe(sampleEntry.stackTrace);
  });

  it('should include additional fields', () => {
    const additionalFields = {
      app: 'test-app',
      env: 'development',
      version: '1.0.0'
    };
    
    const format = new JsonFormat({ additionalFields });
    const result = format.format(sampleEntry);
    const parsed = JSON.parse(result);
    
    expect(parsed.app).toBe(additionalFields.app);
    expect(parsed.env).toBe(additionalFields.env);
    expect(parsed.version).toBe(additionalFields.version);
  });

  it('should apply indentation', () => {
    const format = new JsonFormat({ indent: 2 });
    const result = format.format(sampleEntry);
    
    expect(result).toContain('\n  "');
    expect(result.split('\n').length).toBeGreaterThan(1);
  });

  it('should use unix timestamps when configured', () => {
    const format = new JsonFormat({ useUnixTimestamps: true });
    const result = format.format(sampleEntry);
    const parsed = JSON.parse(result);
    
    // Unix timestamp for 2023-01-01T12:00:00.000Z
    expect(typeof parsed.timestamp).toBe('number');
    expect(parsed.timestamp).toBe(new Date(sampleEntry.timestamp).getTime());
  });
}); 