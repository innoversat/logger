import { Logger } from '../logger';
import { LogLevel } from '../log-level';
import { ConsoleTransport } from '../transports/console.transport';
import { FileTransport } from '../transports/file.transport';
import { HttpTransport } from '../transports/http.transport';
import { SimpleFormat } from '../formats/simple.format';
import { JsonFormat } from '../formats/json.format';

/**
 * Example logger using advanced features
 */
async function runAdvancedExample() {
  // Create the main logger
  const logger = new Logger({
    level: LogLevel.DEBUG,
    console: false, // Disable default console transport
    file: false,    // Disable default file transport
    includeTimestamp: true,
    includeStackTrace: true,
    environment: 'development',
    asyncLogging: true,
    appName: 'advanced-example'
  });
  
  // 1. Console Transport - Simple formatted
  const simpleFormat = new SimpleFormat({
    showTimestamp: true,
    timestampFormat: 'LOCAL',
    dateFormatOptions: { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    }
  });
  
  const consoleTransport = new ConsoleTransport({
    minLevel: LogLevel.DEBUG,
    colorize: true,
    showTimestamp: true,
    showLevel: true,
    format: 'simple'
  });
  
  // Adding our own formatting function to the transport (monkey patching)
  const originalLog = consoleTransport.log;
  consoleTransport.log = function(entry) {
    const formattedMessage = simpleFormat.format(entry);
    // Call the original log function, but modify the entry
    const modifiedEntry = { ...entry, message: formattedMessage };
    return originalLog.call(this, modifiedEntry);
  };
  
  // 2. File Transport - JSON formatted
  const jsonFormat = new JsonFormat({
    indent: 2,
    additionalFields: {
      app: 'advanced-example',
      env: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }
  });
  
  const fileTransport = new FileTransport({
    filename: 'advanced-example.log',
    directory: './logs',
    minLevel: LogLevel.INFO,
    format: 'json',
    datePattern: 'daily',
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 7 // One week of logs
  });
  
  // Adding our own formatting function to the transport
  const originalFileLog = fileTransport.log;
  fileTransport.log = function(entry) {
    const formattedMessage = jsonFormat.format(entry);
    // JSON already contains all formatted information, so we use it as the message
    // and clean up other fields
    const modifiedEntry = { 
      ...entry, 
      message: formattedMessage,
      meta: undefined,
      stackTrace: undefined
    };
    return originalFileLog.call(this, modifiedEntry);
  };
  
  // 3. HTTP Transport - with JSON format
  // Note: This example won't work because there's no real endpoint
  const httpTransport = new HttpTransport({
    url: 'https://example.com/logs',
    minLevel: LogLevel.WARN,
    headers: {
      'Authorization': 'Bearer fake-token',
      'Content-Type': 'application/json'
    },
    retryCount: 3,
    retryDelay: 1000,
    batchLogs: true,
    batchSize: 10
  });
  
  // Modify the HTTP transport to suppress error messages (because we're using a fake URL)
  const originalSendBatch = httpTransport['sendBatch'];
  httpTransport['sendBatch'] = async function() {
    // In a real application, you would not modify this function
    // This is just to prevent error messages in the example
    console.log('Note: HTTP transport is configured with a fake URL. In a real application, use a valid API endpoint.');
    return Promise.resolve();
  };
  
  // Add all transports to the logger
  logger.addTransport(consoleTransport);
  logger.addTransport(fileTransport);
  logger.addTransport(httpTransport);
  
  // Create a child logger with additional metadata
  const userLogger = logger.child({
    meta: { 
      component: 'user-service',
      context: 'authentication'
    }
  });
  
  // Example log messages at different levels
  logger.debug('Debug level log message');
  logger.info('Info level log message', { user: 'anonymous' });
  logger.warn('Warning level log message', { attemptCount: 3 });
  
  try {
    // Simulate an error
    throw new Error('Example error!');
  } catch (error) {
    logger.error('Error occurred', { error });
  }
  
  // Logging with the child logger
  userLogger.info('User logged in', { userId: 12345 });
  userLogger.warn('Suspicious login attempt', { userId: 98765, ip: '192.168.1.100' });
  
  // Wait a bit for async logs to be processed
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Close the logger properly
  await logger.close();
  
  console.log('\nAll logs processed successfully and transports closed.');
}

// Run the example
runAdvancedExample().catch(console.error); 