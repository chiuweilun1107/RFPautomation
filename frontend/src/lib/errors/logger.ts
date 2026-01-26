/**
 * Structured Logger System
 * Centralized logging with context and metadata
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: LogMetadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, metadata, error } = entry;

    if (this.isDevelopment) {
      // Structured format for development
      const parts = [
        `[${timestamp}]`,
        `[${level.toUpperCase()}]`,
        context ? `[${context}]` : '',
        message,
      ].filter(Boolean);

      let output = parts.join(' ');

      if (metadata && Object.keys(metadata).length > 0) {
        output += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
      }

      if (error) {
        output += `\n  Error: ${error.name}: ${error.message}`;
        if (error.stack) {
          output += `\n  Stack: ${error.stack}`;
        }
      }

      return output;
    } else {
      // JSON format for production (easier for log aggregation)
      return JSON.stringify(entry);
    }
  }

  /**
   * Log an entry
   */
  private log(level: LogLevel, message: string, context?: string, metadata?: LogMetadata) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };

    const formatted = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.warn(formatted);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.warn(formatted);
        }
        break;
    }
  }

  /**
   * Log error with context
   */
  error(message: string, error?: Error | unknown, context?: string, metadata?: LogMetadata) {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        code: 'code' in error ? String(error.code) : undefined,
      };
    } else if (error) {
      entry.metadata = {
        ...metadata,
        error: error,
      };
    }

    console.error(this.formatLogEntry(entry));
  }

  /**
   * Log warning
   */
  warn(message: string, context?: string, metadata?: LogMetadata) {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * Log info
   */
  info(message: string, context?: string, metadata?: LogMetadata) {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log debug (only in development)
   */
  debug(message: string, context?: string, metadata?: LogMetadata) {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, metadata?: LogMetadata) {
    this.info(`API Request: ${method} ${path}`, 'API', metadata);
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, statusCode: number, duration?: number) {
    const metadata: LogMetadata = {
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    };
    this.info(`API Response: ${method} ${path} - ${statusCode}`, 'API', metadata);
  }

  /**
   * Log database query
   */
  dbQuery(operation: string, table: string, metadata?: LogMetadata) {
    this.debug(`DB Query: ${operation} on ${table}`, 'Database', metadata);
  }

  /**
   * Log external API call
   */
  externalApi(service: string, operation: string, metadata?: LogMetadata) {
    this.debug(`External API: ${service} - ${operation}`, 'External', metadata);
  }

  /**
   * Log workflow execution
   */
  workflow(workflowName: string, status: string, metadata?: LogMetadata) {
    this.info(`Workflow: ${workflowName} - ${status}`, 'Workflow', metadata);
  }
}

// Export singleton instance
export const logger = new Logger();

// Type-safe context creators for common scenarios
export const createApiContext = (method: string, path: string) => `API:${method}:${path}`;
export const createDbContext = (operation: string, table: string) => `DB:${operation}:${table}`;
export const createWorkflowContext = (workflowName: string) => `Workflow:${workflowName}`;
