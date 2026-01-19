/**
 * Error Handling Utilities (Legacy)
 * Type-safe error handling helpers
 *
 * NOTE: This file is maintained for backward compatibility.
 * New code should use:
 * - @/lib/errors/AppError for custom error classes
 * - @/lib/errors/error-handler for error handling
 * - @/lib/errors/logger for logging
 */

import { isAppError, AppError } from './errors/AppError';
import { extractErrorMessage } from './errors/error-handler';

/**
 * Type guard to check if value is an Error object
 * @deprecated Use isAppError from @/lib/errors/AppError instead
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error message from unknown error
 * @deprecated Use extractErrorMessage from @/lib/errors/error-handler instead
 */
export function getErrorMessage(error: unknown): string {
  return extractErrorMessage(error, 'An unknown error occurred');
}

/**
 * Type guard for API error responses
 * @deprecated Use ErrorResponse from @/lib/errors/error-handler instead
 */
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}

export function isApiError(value: unknown): value is ApiErrorResponse {
  // Check for new error format first
  if (isAppError(value)) {
    return true;
  }

  // Legacy format
  return (
    value !== null &&
    typeof value === 'object' &&
    ('error' in value || 'message' in value)
  );
}

/**
 * Extract error message from API error response
 * @deprecated Use extractErrorMessage from @/lib/errors/error-handler instead
 */
export function getApiErrorMessage(error: unknown, defaultMessage = 'Request failed'): string {
  // Handle new AppError format
  if (isAppError(error)) {
    return error.message;
  }

  // Handle new ErrorResponse format
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'message' in error.error
  ) {
    return String(error.error.message);
  }

  // Legacy format
  if (isApiError(error)) {
    return error.error || error.message || defaultMessage;
  }

  return extractErrorMessage(error, defaultMessage);
}

// Re-export new error utilities for gradual migration
export { isAppError, AppError } from './errors/AppError';
export { extractErrorMessage, handleError } from './errors/error-handler';
export { logger } from './errors/logger';
