import { LogLevel } from '../log-level';
import { LogEntry } from '../transports/base.transport';
import { ConsoleTransport } from '../transports/console.transport';
import { FileTransport } from '../transports/file.transport';
import * as fs from 'fs';
import * as path from 'path';

// Mock console.log
const originalConsoleLog = console.log;
let consoleOutput: any[] = [];

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((message: any) => {
    consoleOutput.push(message);
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

// Sample log entry for testing
const sampleEntry: LogEntry = {
  timestamp: '2023-01-01T12:00:00.000Z',
  level: LogLevel.INFO,
  message: 'Test message',
  meta: { user: 'test-user' }
};

describe('ConsoleTransport', () => {
  it('should log messages to console', () => {
    const transport = new ConsoleTransport({
      colorize: false // Disable colors to make testing easier
    });
    transport.log(sampleEntry);
    
    expect(consoleOutput.length).toBe(1);
    const message = typeof consoleOutput[0] === 'string' 
      ? consoleOutput[0] 
      : JSON.stringify(consoleOutput[0]);
    expect(message).toContain('Test message');
  });

  it('should respect minimum log level', () => {
    const transport = new ConsoleTransport({
      minLevel: LogLevel.WARN,
      colorize: false
    });
    
    transport.log({
      ...sampleEntry,
      level: LogLevel.DEBUG
    });
    
    expect(consoleOutput.length).toBe(0);
    
    transport.log({
      ...sampleEntry,
      level: LogLevel.WARN
    });
    
    expect(consoleOutput.length).toBe(1);
  });

  it('should format messages based on format option', () => {
    const jsonTransport = new ConsoleTransport({ 
      format: 'json',
      colorize: false
    });
    
    jsonTransport.log(sampleEntry);
    const jsonOutput = typeof consoleOutput[0] === 'string'
      ? consoleOutput[0]
      : JSON.stringify(consoleOutput[0]);
    expect(jsonOutput).toContain('"level":"info"');
    
    consoleOutput = [];
    
    const detailedTransport = new ConsoleTransport({ 
      format: 'detailed',
      colorize: false
    });
    
    detailedTransport.log(sampleEntry);
    const detailedOutput = typeof consoleOutput[0] === 'string'
      ? consoleOutput[0]
      : JSON.stringify(consoleOutput[0]);
    expect(detailedOutput).toContain('TIME:');
  });
});

describe('FileTransport', () => {
  // Create test directory
  const testLogDir = path.join(process.cwd(), 'test-logs');
  const testLogFile = path.join(testLogDir, 'test.log');
  
  beforeEach(() => {
    // Ensure the test directory exists
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }
    
    // Clear the test file if it exists
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });
  
  afterEach(() => {
    // Clean up the test file after each test
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });
  
  afterAll(() => {
    // Clean up the test directory after all tests
    if (fs.existsSync(testLogDir)) {
      fs.rmdirSync(testLogDir);
    }
  });
  
  it('should write logs to a file', (done) => {
    const transport = new FileTransport({
      filename: 'test.log',
      directory: testLogDir
    });
    
    transport.log(sampleEntry);
    
    // Wait for file to be written
    setTimeout(() => {
      expect(fs.existsSync(testLogFile)).toBe(true);
      const content = fs.readFileSync(testLogFile, 'utf8');
      
      expect(content).toContain('Test message');
      expect(content).toContain(sampleEntry.timestamp);
      
      done();
    }, 100);
  });
  
  it('should respect minimum log level for file transport', (done) => {
    const transport = new FileTransport({
      filename: 'test.log',
      directory: testLogDir,
      minLevel: LogLevel.ERROR
    });
    
    // This should not be logged
    transport.log({
      ...sampleEntry,
      level: LogLevel.INFO
    });
    
    // Wait for any potential file operations
    setTimeout(() => {
      // Should not create a file since the log level is below minLevel
      if (fs.existsSync(testLogFile)) {
        const content = fs.readFileSync(testLogFile, 'utf8');
        expect(content).toBe('');
      }
      
      done();
    }, 100);
  });
  
  it('should format logs as JSON when specified', (done) => {
    const transport = new FileTransport({
      filename: 'test.log',
      directory: testLogDir,
      format: 'json'
    });
    
    transport.log(sampleEntry);
    
    // Wait for file to be written
    setTimeout(() => {
      expect(fs.existsSync(testLogFile)).toBe(true);
      const content = fs.readFileSync(testLogFile, 'utf8');
      
      // Should be valid JSON
      let isValidJson = false;
      try {
        JSON.parse(content);
        isValidJson = true;
      } catch (e) {
        isValidJson = false;
      }
      
      expect(isValidJson).toBe(true);
      
      done();
    }, 100);
  });
}); 