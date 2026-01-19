/**
 * Error Handler Utilities
 * Centralized error handling and response formatting
 */

import { NextResponse } from 'next/server';
import { AppError, isAppError, InternalError, ErrorContext } from './AppError';
import { logger } from './logger';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    context?: ErrorContext;
    requestId?: string;
  };
}

/**
 * Handle error and return NextResponse
 */
export function handleError(
  error: unknown,
  context?: string,
  requestId?: string
): NextResponse<ErrorResponse> {
  let appError: AppError;

  // Convert unknown error to AppError
  if (isAppError(error)) {
    appError = error;
  } else if (error instanceof Error) {
    // Wrap standard Error in InternalError
    appError = new InternalError(error.message, {
      originalError: error.name,
    });
  } else {
    // Handle unknown error types
    appError = new InternalError('An unexpected error occurred', {
      error: String(error),
    });
  }

  // Log the error with context
  logger.error(
    appError.message,
    appError,
    context,
    {
      code: appError.code,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
      requestId,
      ...appError.context,
    }
  );

  // Create error response
  const response: ErrorResponse = {
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp,
      ...(appError.context && { context: appError.context }),
      ...(requestId && { requestId }),
    },
  };

  return NextResponse.json(response, { status: appError.statusCode });
}

/**
 * Async handler wrapper for API routes
 * Catches errors and handles them consistently
 * Supports both Request and NextRequest
 */
export function asyncHandler<T = unknown, R extends Request = Request>(
  handler: (request: R, context?: { params: unknown }) => Promise<NextResponse<T>>
) {
  return async (
    request: R,
    context?: { params: unknown }
  ): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Generate request ID from headers or create new one
      const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

      return handleError(
        error,
        `${request.method} ${new URL(request.url).pathname}`,
        requestId
      );
    }
  };
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  statusCode = 200,
  metadata?: Record<string, unknown>
): NextResponse<{ data: T; metadata?: Record<string, unknown> }> {
  return NextResponse.json(
    {
      data,
      ...(metadata && { metadata }),
    },
    { status: statusCode }
  );
}

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new InternalError('Invalid JSON in request body', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T>(
  body: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = body[field as keyof T];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new BadRequestError('Missing required fields', {
      missingFields: missingFields.map(String),
    });
  }
}

/**
 * Safe database operation wrapper
 */
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new InternalError(errorMessage, {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Safe external API call wrapper
 */
export async function safeExternalApiCall<T>(
  service: string,
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new InternalError(
      errorMessage || `External API call to ${service} failed`,
      {
        service,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Extract error message from unknown error
 */
export function extractErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return defaultMessage;
}

/**
 * Check if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (!isAppError(error)) {
    return false;
  }

  // Retry on service unavailable or external API errors
  return (
    error.statusCode === 503 ||
    error.statusCode === 502 ||
    error.code === 'SERVICE_UNAVAILABLE' ||
    error.code === 'EXTERNAL_API_ERROR'
  );
}
