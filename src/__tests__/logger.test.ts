import { Logger } from '../logger';
import { LogLevel } from '../log-level';

// Mock console.log
const originalConsoleLog = console.log;
let consoleOutput: string[] = [];

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((message: string) => {
    consoleOutput.push(message);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('Logger', () => {
  it('should create a logger with default options', () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should log messages with the appropriate level', () => {
    const logger = new Logger({ console: { colorize: false } });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    expect(consoleOutput.length).toBe(4);
    expect(consoleOutput[0]).toContain('[DEBUG]');
    expect(consoleOutput[0]).toContain('Debug message');
    expect(consoleOutput[1]).toContain('[INFO]');
    expect(consoleOutput[1]).toContain('Info message');
    expect(consoleOutput[2]).toContain('[WARN]');
    expect(consoleOutput[2]).toContain('Warning message');
    expect(consoleOutput[3]).toContain('[ERROR]');
    expect(consoleOutput[3]).toContain('Error message');
  });

  it('should respect minimum log level', () => {
    const logger = new Logger({ 
      level: LogLevel.WARN,
      console: { colorize: false }
    });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    expect(consoleOutput.length).toBe(2);
    expect(consoleOutput[0]).toContain('[WARN]');
    expect(consoleOutput[1]).toContain('[ERROR]');
  });

  it('should include metadata in log messages', () => {
    const logger = new Logger({ console: { colorize: false } });
    const metadata = { userId: '123', action: 'login' };
    
    logger.info('User action', metadata);
    
    expect(consoleOutput[0]).toContain('User action');
    expect(consoleOutput[0]).toContain(JSON.stringify(metadata));
  });

  it('should include timestamps when enabled', () => {
    const logger = new Logger({ 
      includeTimestamp: true,
      console: { colorize: false }
    });
    
    logger.info('Test message');
    
    // ISO date format regex
    const isoDateRegex = /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/;
    expect(consoleOutput[0]).toMatch(isoDateRegex);
  });
}); 