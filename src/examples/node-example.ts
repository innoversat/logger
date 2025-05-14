import { Logger } from '../logger';
import { LogLevel } from '../log-level';

// Create a custom logger instance with specific options
const logger = new Logger({
  level: LogLevel.DEBUG,
  console: {
    colorize: true,
    format: 'simple'
  },
  file: {
    filename: 'application.log',
    directory: './logs'
  },
  includeTimestamp: true,
  includeStackTrace: true,
  environment: 'development'
});

// Example usage of different log levels
function runExample() {
  logger.debug('This is a debug message', { user: 'test-user' });
  logger.info('Application started successfully');
  logger.warn('Configuration file not found, using defaults');
  
  try {
    // Simulate an error
    throw new Error('Something went wrong!');
  } catch (error) {
    logger.error('An error occurred', { error });
  }
  
  logger.fatal('Critical system failure', { service: 'database' });
  
  // Different environments example
  if (process.env.NODE_ENV === 'production') {
    // Production-specific logging
    logger.info('Running in production mode');
  } else {
    // Development-specific logging with more details
    logger.debug('Running in development mode with verbose logging');
  }
  
  // Close the logger when done (important for file logging)
  logger.close();
}     

// Run the example
runExample(); 