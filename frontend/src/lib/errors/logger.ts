/**
 * Structured Logger System
 * Centralized logging with context and metadata
 *
 * Note: INFO and DEBUG logs are suppressed by default.
 * Only ERROR and WARN are output to console.
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
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, metadata, error } = entry;

    if (this.isDevelopment) {
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
      return JSON.stringify(entry);
    }
  }

  /**
   * Log an entry
   * Only ERROR and WARN are output; INFO and DEBUG are suppressed
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
      case LogLevel.DEBUG:
        // Suppressed - no console output
        // In production, send to external logging service if needed
        if (this.isProduction) {
          this.sendToExternalService(entry);
        }
        break;
    }
  }

  /**
   * Send log entry to external service (placeholder)
   */
  private sendToExternalService(_entry: LogEntry) {
    // Placeholder for external logging service integration
    // e.g., Sentry, LogRocket, Datadog, etc.
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
   * Log info (suppressed in console, but collected)
   */
  info(message: string, context?: string, metadata?: LogMetadata) {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log debug (suppressed in console, only in development)
   */
  debug(message: string, context?: string, metadata?: LogMetadata) {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log API request (suppressed)
   */
  apiRequest(method: string, path: string, metadata?: LogMetadata) {
    this.info(`API Request: ${method} ${path}`, 'API', metadata);
  }

  /**
   * Log API response (suppressed)
   */
  apiResponse(method: string, path: string, statusCode: number, duration?: number) {
    const metadata: LogMetadata = {
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    };
    this.info(`API Response: ${method} ${path} - ${statusCode}`, 'API', metadata);
  }

  /**
   * Log database query (suppressed)
   */
  dbQuery(operation: string, table: string, metadata?: LogMetadata) {
    this.debug(`DB Query: ${operation} on ${table}`, 'Database', metadata);
  }

  /**
   * Log external API call (suppressed)
   */
  externalApi(service: string, operation: string, metadata?: LogMetadata) {
    this.debug(`External API: ${service} - ${operation}`, 'External', metadata);
  }

  /**
   * Log workflow execution (suppressed)
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
