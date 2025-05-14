import React, { useEffect, useState } from "react";
import { LogLevel } from "../log-level";
import { LoggerProvider, useLogger, withLogger } from "../react/LoggerProvider";

// Component using the useLogger hook
const LoggerDemo: React.FC = () => {
  const logger = useLogger();
  const [count, setCount] = useState(0);

  // Log when component mounts
  useEffect(() => {
    logger.info("LoggerDemo component mounted");

    return () => {
      logger.debug("LoggerDemo component unmounted");
    };
  }, [logger]);

  // Log button click
  const handleClick = () => {
    setCount((prev) => prev + 1);
    logger.debug("Button clicked", { count: count + 1 });

    if (count + 1 === 5) {
      logger.warn("Button clicked 5 times!");
    }
  };

  // Log errors
  const handleErrorClick = () => {
    try {
      throw new Error("Demo error");
    } catch (error) {
      logger.error("An error occurred in the component", { error });
    }
  };

  return (
    <div>
      <h2>Logger Demo</h2>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment (logs debug message)</button>
      <button onClick={handleErrorClick}>
        Trigger Error (logs error message)
      </button>
    </div>
  );
};

// Component using the withLogger HOC
class ClassLoggerDemo extends React.Component<{ logger?: any }> {
  componentDidMount() {
    this.props.logger?.info("ClassLoggerDemo mounted");
  }

  componentWillUnmount() {
    this.props.logger?.debug("ClassLoggerDemo unmounted");
  }

  render() {
    return <div>Class Component with Logger</div>;
  }
}

const ClassLoggerDemoWithLogger = withLogger(ClassLoggerDemo);

// App component with LoggerProvider
export const App: React.FC = () => {
  return (
    <LoggerProvider
      options={{
        level: LogLevel.DEBUG,
        console: {
          colorize: true,
          format: "simple",
        },
        includeTimestamp: true,
        environment:
          process.env.NODE_ENV === "production" ? "production" : "development",
      }}
    >
      <div>
        <h1>React Logger Example</h1>
        <LoggerDemo />
        <ClassLoggerDemoWithLogger />
      </div>
    </LoggerProvider>
  );
};
