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
  
  it('should create and use child loggers', () => {
    const logger = new Logger({ console: { colorize: false } });
    
    const childLogger = logger.child({
      meta: { component: 'auth-service' }
    });
    
    childLogger.info('Login attempt');
    
    expect(consoleOutput[0]).toContain('Login attempt');
    expect(consoleOutput[0]).toContain('component');
    expect(consoleOutput[0]).toContain('auth-service');
  });
  
  it('should merge metadata in child loggers', () => {
    const logger = new Logger({ console: { colorize: false } });
    
    const childLogger = logger.child({
      meta: { component: 'auth-service' }
    });
    
    childLogger.info('Login attempt', { userId: '123', status: 'success' });
    
    expect(consoleOutput[0]).toContain('Login attempt');
    expect(consoleOutput[0]).toContain('component');
    expect(consoleOutput[0]).toContain('auth-service');
    expect(consoleOutput[0]).toContain('userId');
    expect(consoleOutput[0]).toContain('status');
  });
  
  it('should handle async logging', (done) => {
    const logger = new Logger({
      asyncLogging: true,
      console: { colorize: false }
    });
    
    logger.info('Async message');
    
    // This should be processed asynchronously, so it might not be in the output immediately
    if (consoleOutput.length === 0) {
      // Wait a bit for async logging to complete
      setTimeout(() => {
        expect(consoleOutput.length).toBeGreaterThan(0);
        expect(consoleOutput[0]).toContain('Async message');
        done();
      }, 50);
    } else {
      // It was already processed
      expect(consoleOutput[0]).toContain('Async message');
      done();
    }
  });
  
  it('should include stack traces for error logs', () => {
    const logger = new Logger({ 
      console: { colorize: false },
      includeStackTrace: true
    });
    
    logger.error('Error occurred');
    
    // Check for stack trace pattern - looking for "at" followed by function name or file location
    expect(consoleOutput[0]).toMatch(/at\s+[\w.<>\[\]]+\s+\(/);
  });
  
  it('should close and clean up resources', async () => {
    const logger = new Logger({ console: { colorize: false } });
    
    // This should not throw an error
    await logger.close();
    
    // Logging after close should show a warning
    const originalConsoleWarn = console.warn;
    let warningLogged = false;
    
    console.warn = jest.fn(() => {
      warningLogged = true;
    });
    
    logger.info('Message after close');
    
    console.warn = originalConsoleWarn;
    
    expect(warningLogged).toBe(true);
  });
}); 