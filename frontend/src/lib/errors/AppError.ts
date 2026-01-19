/**
 * Application Error Classes
 * Comprehensive error hierarchy for type-safe error handling
 */

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Business Logic Errors
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
}

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational = true,
    context?: ErrorContext
  ) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Make the error serializable
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Client Errors (4xx)
 */

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', context?: ErrorContext) {
    super(message, ErrorCode.BAD_REQUEST, 400, true, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', context?: ErrorContext) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', context?: ErrorContext) {
    super(message, ErrorCode.FORBIDDEN, 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', context?: ErrorContext) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', context?: ErrorContext) {
    super(message, ErrorCode.CONFLICT, 409, true, context);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_ERROR, 422, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context);
  }
}

/**
 * Server Errors (5xx)
 */

export class InternalError extends AppError {
  constructor(message = 'Internal server error', context?: ErrorContext) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, false, context);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service = 'Service', context?: ErrorContext) {
    super(`${service} is unavailable`, ErrorCode.SERVICE_UNAVAILABLE, 503, true, context);
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, message?: string, context?: ErrorContext) {
    super(
      message || `External API error: ${service}`,
      ErrorCode.EXTERNAL_API_ERROR,
      502,
      true,
      context
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', context?: ErrorContext) {
    super(message, ErrorCode.DATABASE_ERROR, 500, false, context);
  }
}

/**
 * Business Logic Errors
 */

export class WorkflowError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.WORKFLOW_ERROR, 500, true, context);
  }
}

export class ParsingError extends AppError {
  constructor(message = 'Failed to parse content', context?: ErrorContext) {
    super(message, ErrorCode.PARSING_ERROR, 500, true, context);
  }
}

export class GenerationError extends AppError {
  constructor(message = 'Failed to generate content', context?: ErrorContext) {
    super(message, ErrorCode.GENERATION_ERROR, 500, true, context);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational (expected/handled)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
