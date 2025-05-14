import React, { createContext, useContext, ReactNode } from "react";
import { Logger, LoggerOptions } from "../logger";
import { LogLevel } from "../log-level";
import { Transport } from "../transports";

// Context interface
interface LoggerContextType {
  logger: Logger;
  addTransport: (transport: Transport) => void;
}

// Create a context for the logger
const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

interface LoggerProviderProps {
  children: ReactNode;
  options?: LoggerOptions;
}

/**
 * Logger Provider Component for React applications
 */
export const LoggerProvider: React.FC<LoggerProviderProps> = ({
  children,
  options,
}) => {
  // Create a logger instance with the provided options
  const loggerInstance = React.useMemo(() => new Logger(options), [options]);

  // Context value
  const contextValue = React.useMemo(
    () => ({
      logger: loggerInstance,
      addTransport: (transport: Transport) =>
        loggerInstance.addTransport(transport),
    }),
    [loggerInstance]
  );

  // Cleanup
  React.useEffect(() => {
    return () => {
      // Clean up logger when component unmounts
      loggerInstance.close();
    };
  }, [loggerInstance]);

  return (
    <LoggerContext.Provider value={contextValue}>
      {children}
    </LoggerContext.Provider>
  );
};

/**
 * Hook to use the logger within React components
 */
export const useLogger = (): Logger => {
  const context = useContext(LoggerContext);

  if (!context) {
    throw new Error("useLogger must be used within a LoggerProvider");
  }

  return context.logger;
};

/**
 * Hook to add transports
 */
export const useTransport = (): ((transport: Transport) => void) => {
  const context = useContext(LoggerContext);

  if (!context) {
    throw new Error("useTransport must be used within a LoggerProvider");
  }

  return context.addTransport;
};

/**
 * Higher-order component to inject logger into a component
 */
export function withLogger<T extends { logger?: Logger }>(
  Component: React.ComponentType<T>
): React.FC<Omit<T, "logger">> {
  return (props: Omit<T, "logger">) => {
    const logger = useLogger();
    return <Component {...(props as any)} logger={logger} />;
  };
}
