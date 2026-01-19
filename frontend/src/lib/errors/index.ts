/**
 * Unified Error Handling System
 * Central export point for all error handling utilities
 */

// Error Classes
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  ServiceUnavailableError,
  ExternalApiError,
  DatabaseError,
  WorkflowError,
  ParsingError,
  GenerationError,
  isAppError,
  isOperationalError,
} from './AppError';

export type {
  ErrorCode,
  ErrorContext,
} from './AppError';

// Error Handler
export {
  type ErrorResponse,
  handleError,
  asyncHandler,
  successResponse,
  parseRequestBody,
  validateRequiredFields,
  safeDatabaseOperation,
  safeExternalApiCall,
  extractErrorMessage,
  isRetryableError,
} from './error-handler';

// Logger
export {
  logger,
  LogLevel,
  type LogMetadata,
  type LogEntry,
  createApiContext,
  createDbContext,
  createWorkflowContext,
} from './logger';
