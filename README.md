# Innoversat Logger

Advanced, customizable, TypeScript-based logging library. Designed for both Node.js and React applications.

## Features

- ⚡ Multiple log levels: `debug`, `info`, `warn`, `error`, `fatal`
- 🎨 Colored terminal output
- 📅 Timestamp formatting
- 🔢 Customizable formats (JSON, CSV, template)
- 🔌 Plugin architecture (Transports)
- 🔄 Environment-specific configuration (development/production)
- 📝 File logging and automatic file rotation
- 📋 Asynchronous logging and batch processing
- 🌐 Log delivery to HTTP/API endpoints
- 📚 Stack trace and context information
- ⚛️ React integration (Context API)
- 🪝 Easy React usage with Hooks and HOC support

## Installation

```bash
pnpm install @innoversat/logger # or npm install @innoversat/logger or yarn install @innoversat/logger
```

## Basic Usage

### Node.js

```typescript
import { Logger, LogLevel } from "@innoversat/logger";

// Basic logger example
const logger = new Logger({
  level: LogLevel.DEBUG,
  useColor: true,
  includeTimestamp: true,
});

// Using different log levels
logger.debug("Debug message");
logger.info("Information message");
logger.warn("Warning message");
logger.error("Error occurred", { error: new Error("Something went wrong") });
logger.fatal("Critical error", { service: "database" });

// Close the logger when finished
logger.close();
```

### React

```tsx
import React from "react";
import { LogLevel, LoggerProvider, useLogger } from "@innoversat/logger";

// Wrap application with LoggerProvider
const App = () => {
  return (
    <LoggerProvider
      options={{
        level: LogLevel.DEBUG,
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
      }}
    >
      <YourApp />
    </LoggerProvider>
  );
};

// Using logger with hooks
const MyComponent = () => {
  const logger = useLogger();

  useEffect(() => {
    logger.info("Component loaded");
    return () => logger.debug("Component removed");
  }, [logger]);

  return <div>My Component</div>;
};
```

## Transport System

Logger uses an extensible transport system that allows you to send logs to different destinations.

### Available Transports

- **ConsoleTransport**: Sends logs to terminal/console (default)
- **FileTransport**: Saves logs to files, supports size-based rotation
- **HttpTransport**: Sends logs in JSON format to HTTP endpoints

### Custom Transport Usage

```typescript
import { Logger, LogLevel, ConsoleTransport, FileTransport, HttpTransport } from "@innoversat/logger";

// Configure transports
const consoleTransport = new ConsoleTransport({
  level: LogLevel.DEBUG,
  useColor: true,
});

const fileTransport = new FileTransport({
  level: LogLevel.INFO,
  dirname: "./logs",
  filename: "app",
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
});

const httpTransport = new HttpTransport({
  url: "https://logs.myapi.com/collect",
  level: LogLevel.ERROR,
  headers: {
    Authorization: "Bearer token123",
  },
  batchSize: 10,
});

// Create a logger using all transports
const logger = new Logger({
  transports: [consoleTransport, fileTransport, httpTransport],
});
```

## Format System

You can customize how logs are formatted.

```typescript
import { ConsoleTransport, jsonFormat, csvFormat, templateFormat } from "@innoversat/logger";

// JSON format
const jsonConsole = new ConsoleTransport({
  format: jsonFormat,
});

// CSV format
const csvFile = new FileTransport({
  format: csvFormat,
  filename: "logs.csv",
});

// Template format
const templateConsole = new ConsoleTransport({
  format: templateFormat("[{timestamp}] | {level} | {message}"),
});
```

## Asynchronous Logging

You can use asynchronous logging for high performance.

```typescript
const logger = new Logger({
  async: true,
  asyncInterval: 2000, // Batch processing every 2 seconds
  level: LogLevel.DEBUG,
});

// Make sure all queued logs are processed when closing the logger
await logger.close();
```

## React Hooks and Components

```tsx
import { LoggerProvider, useLogger, useTransport } from '@innoversat/logger';

// Hook that logs user actions automatically
function useActionLogger() {
  const logger = useLogger();

  return useCallback((action, data) => {
    logger.info(`User action: ${action}`, {
      action,
      data,
      timestamp: new Date()
    });
  }, [logger]);
}

// Hook to add transports
function MyLoggingComponent() {
  const addTransport = useTransport();

  useEffect(() => {
    // Add a custom transport
    const myTransport = new ConsoleTransport({...});
    addTransport(myTransport);
  }, [addTransport]);

  return <div>Logging Component</div>;
}
```

## Configuration Options

Logger accepts the following options:

| Option            | Type        | Default        | Description                                 |
| ----------------- | ----------- | -------------- | ------------------------------------------- |
| level             | LogLevel    | LogLevel.DEBUG | Minimum log level                           |
| useColor          | boolean     | true           | Use color in terminal output                |
| includeTimestamp  | boolean     | true           | Add timestamp                               |
| includeStackTrace | boolean     | false          | Add stack trace in error/fatal logs         |
| environment       | string      | 'development'  | Environment ('development' or 'production') |
| logToFile         | boolean     | false          | Save logs to file                           |
| logFilePath       | string      | './logs'       | Log files directory                         |
| async             | boolean     | false          | Use asynchronous logging                    |
| asyncInterval     | number      | 1000           | Asynchronous batch interval (ms)            |
| transports        | Transport[] | []             | Array of transports                         |
| format            | Function    |                | Custom formatting function                  |

## Transport Options

### ConsoleTransport

| Option   | Type     | Description         |
| -------- | -------- | ------------------- |
| level    | LogLevel | Minimum log level   |
| useColor | boolean  | Use coloring        |
| colorize | object   | Color mapping       |
| format   | Function | Formatting function |

### FileTransport

| Option    | Type     | Description               |
| --------- | -------- | ------------------------- |
| level     | LogLevel | Minimum log level         |
| dirname   | string   | Log directory             |
| filename  | string   | File name                 |
| extension | string   | File extension            |
| maxSize   | number   | Maximum file size (bytes) |
| maxFiles  | number   | Maximum number of files   |
| format    | Function | Formatting function       |

### HttpTransport

| Option     | Type     | Description            |
| ---------- | -------- | ---------------------- |
| url        | string   | Target URL             |
| level      | LogLevel | Minimum log level      |
| method     | string   | HTTP method (POST/PUT) |
| headers    | object   | HTTP headers           |
| batchSize  | number   | Logs per batch         |
| timeoutMs  | number   | Batch sending interval |
| maxRetries | number   | Maximum retry count    |

## Development and Testing

### Running Examples

The package comes with two example implementations that demonstrate different features:

```bash
# Run the basic Node.js example
npm run start:node-example

# Run the advanced example with custom transports
npm run start:advanced-example

# Run both examples sequentially
npm run start:all-examples
```

### Testing

The project uses Jest for testing. To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests for specific components
npm run test:formats
npm run test:transports
npm run test:logger

# Generate coverage report
npm run test:coverage
```

### Building

To build the package:

```bash
# Clean and build
npm run build

# Just clean without building
npm run clean
```

## License

MIT
