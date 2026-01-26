/**
 * Unified Error Handler Hook
 *
 * Provides consistent error handling across the application:
 * - Automatic error logging with context
 * - User-friendly toast notifications
 * - Error message extraction
 * - Retry detection for operational errors
 *
 * @example
 * ```tsx
 * const { handleError, handleApiError } = useErrorHandler();
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, 'Operation context');
 * }
 * ```
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  extractErrorMessage,
  isRetryableError,
  isAppError,
  logger
} from '@/lib/errors';

export interface ErrorHandlerOptions {
  /** Custom user-facing error message (overrides extracted message) */
  userMessage?: string;
  /** Context for logging (e.g., 'CreateProject', 'UploadFile') */
  context?: string;
  /** Additional metadata for logging */
  metadata?: Record<string, unknown>;
  /** Whether to show toast notification (default: true) */
  showToast?: boolean;
  /** Toast duration in milliseconds (default: 5000) */
  toastDuration?: number;
  /** Custom toast action (e.g., retry button) */
  toastAction?: {
    label: string;
    onClick: () => void;
  };
}

export interface ErrorInfo {
  /** User-friendly error message */
  message: string;
  /** Whether this error can be retried */
  canRetry: boolean;
  /** HTTP status code if available */
  statusCode?: number;
  /** Error code if available */
  code?: string;
  /** Original error object */
  originalError: unknown;
}

/**
 * Hook for unified error handling
 */
export function useErrorHandler() {
  /**
   * Handle any error with consistent logging and user notification
   */
  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}): ErrorInfo => {
      const {
        userMessage,
        context = 'Application',
        metadata = {},
        showToast = true,
        toastDuration = 5000,
        toastAction,
      } = options;

      // Extract error information
      const message = userMessage || extractErrorMessage(error);
      const canRetry = isRetryableError(error);
      const statusCode = isAppError(error) ? error.statusCode : undefined;
      const code = isAppError(error) ? error.code : undefined;

      // Log the error with context
      logger.error(
        `Error in ${context}`,
        error instanceof Error ? error : undefined,
        context,
        {
          ...metadata,
          canRetry,
          statusCode,
          code,
        }
      );

      // Show user notification
      if (showToast) {
        toast.error(message, {
          duration: toastDuration,
          ...(toastAction && {
            action: {
              label: toastAction.label,
              onClick: toastAction.onClick,
            },
          }),
          ...(canRetry && !toastAction && {
            description: 'This operation can be retried.',
          }),
        });
      }

      return {
        message,
        canRetry,
        statusCode,
        code,
        originalError: error,
      };
    },
    []
  );

  /**
   * Handle API-specific errors (convenience wrapper)
   */
  const handleApiError = useCallback(
    (
      error: unknown,
      operation: string,
      options: Omit<ErrorHandlerOptions, 'context'> = {}
    ): ErrorInfo => {
      return handleError(error, {
        ...options,
        context: `API:${operation}`,
      });
    },
    [handleError]
  );

  /**
   * Handle database operation errors (convenience wrapper)
   */
  const handleDbError = useCallback(
    (
      error: unknown,
      operation: string,
      options: Omit<ErrorHandlerOptions, 'context'> = {}
    ): ErrorInfo => {
      return handleError(error, {
        ...options,
        context: `Database:${operation}`,
        userMessage: options.userMessage || 'Database operation failed. Please try again.',
      });
    },
    [handleError]
  );

  /**
   * Handle file operation errors (convenience wrapper)
   */
  const handleFileError = useCallback(
    (
      error: unknown,
      operation: string,
      fileName?: string,
      options: Omit<ErrorHandlerOptions, 'context' | 'metadata'> = {}
    ): ErrorInfo => {
      return handleError(error, {
        ...options,
        context: `File:${operation}`,
        metadata: { fileName },
        userMessage: options.userMessage || `Failed to ${operation} file${fileName ? `: ${fileName}` : ''}.`,
      });
    },
    [handleError]
  );

  /**
   * Create a safe async wrapper that handles errors automatically
   */
  const createSafeAsync = useCallback(
    <T, Args extends unknown[]>(
      fn: (...args: Args) => Promise<T>,
      options: ErrorHandlerOptions = {}
    ) => {
      return async (...args: Args): Promise<T | null> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, options);
          return null;
        }
      };
    },
    [handleError]
  );

  /**
   * Wrap an operation with retry logic for retryable errors
   */
  const withRetry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options: ErrorHandlerOptions & {
        maxRetries?: number;
        retryDelay?: number;
        onRetry?: (attempt: number) => void;
      } = {}
    ): Promise<T> => {
      const { maxRetries = 3, retryDelay = 1000, onRetry, ...errorOptions } = options;

      let lastError: unknown;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;

          const errorInfo = handleError(error, {
            ...errorOptions,
            showToast: attempt === maxRetries, // Only show toast on final failure
          });

          // Only retry if error is retryable and we haven't exhausted retries
          if (!errorInfo.canRetry || attempt === maxRetries) {
            throw error;
          }

          // Notify about retry
          if (onRetry) {
            onRetry(attempt);
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }

      throw lastError;
    },
    [handleError]
  );

  return {
    handleError,
    handleApiError,
    handleDbError,
    handleFileError,
    createSafeAsync,
    withRetry,
  };
}

/**
 * Hook for handling errors in React Query mutations
 */
export function useMutationErrorHandler(context: string) {
  const { handleError } = useErrorHandler();

  return useCallback(
    (error: unknown, userMessage?: string) => {
      handleError(error, {
        context,
        userMessage,
      });
    },
    [context, handleError]
  );
}

/**
 * Hook for handling errors in React Query queries
 */
export function useQueryErrorHandler(context: string) {
  const { handleError } = useErrorHandler();

  return useCallback(
    (error: unknown) => {
      handleError(error, {
        context,
        userMessage: 'Failed to load data. Please refresh the page.',
      });
    },
    [context, handleError]
  );
}
