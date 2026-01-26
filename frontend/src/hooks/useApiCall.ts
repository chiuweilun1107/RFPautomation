/**
 * Unified API Call Hook
 *
 * Provides a consistent way to make API calls with:
 * - Built-in error handling
 * - Loading state management
 * - Automatic retry for retryable errors
 * - Request cancellation on unmount
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useApiCall();
 *
 * const createProject = async (data: ProjectData) => {
 *   const result = await execute(
 *     fetch('/api/projects', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     }),
 *     { context: 'CreateProject' }
 *   );
 *   if (result) {
 *     toast.success('Project created!');
 *   }
 * };
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useErrorHandler, ErrorHandlerOptions } from './useErrorHandler';

export interface ApiCallOptions extends Omit<ErrorHandlerOptions, 'showToast'> {
  /** Whether to show error toast (default: true) */
  showErrorToast?: boolean;
  /** Whether to throw error after handling (default: false) */
  throwOnError?: boolean;
  /** Enable retry logic (default: false) */
  enableRetry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;
}

export interface ApiCallState<T> {
  /** Current data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
}

/**
 * Hook for making API calls with unified error handling
 */
export function useApiCall<T = unknown>() {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { handleError, withRetry } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Execute an API call with error handling
   */
  const execute = useCallback(
    async (
      requestPromise: Promise<Response> | (() => Promise<Response>),
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      const {
        showErrorToast = true,
        throwOnError = false,
        enableRetry = false,
        maxRetries = 3,
        retryDelay = 1000,
        context = 'API Call',
        userMessage,
        metadata = {},
        toastDuration,
        toastAction,
      } = options;

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState(prev => ({ ...prev, loading: true, error: null }));

      const errorHandlerOptions = {
        context,
        userMessage,
        metadata,
        showToast: showErrorToast,
        toastDuration,
        toastAction,
      };

      try {
        const apiCall = async () => {
          const response = await (typeof requestPromise === 'function'
            ? requestPromise()
            : requestPromise);

          if (!response.ok) {
            // Try to parse error response
            let errorData: { error?: { message?: string } } | undefined;
            try {
              errorData = await response.json();
            } catch {
              // Ignore JSON parse errors
            }

            const errorMessage =
              errorData?.error?.message ||
              response.statusText ||
              `Request failed with status ${response.status}`;

            throw new Error(errorMessage);
          }

          // Parse response
          const contentType = response.headers.get('content-type');
          let data: T;

          if (contentType?.includes('application/json')) {
            const json = await response.json();
            // Handle both { data: T } and direct T responses
            data = 'data' in json ? json.data : json;
          } else if (contentType?.includes('text/')) {
            data = (await response.text()) as unknown as T;
          } else {
            data = (await response.blob()) as unknown as T;
          }

          return data;
        };

        const result = enableRetry
          ? await withRetry(apiCall, {
              maxRetries,
              retryDelay,
              ...errorHandlerOptions,
            })
          : await apiCall();

        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        // Handle abort errors silently
        if (error instanceof Error && error.name === 'AbortError') {
          setState(prev => ({ ...prev, loading: false }));
          return null;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));
        handleError(error, errorHandlerOptions);

        setState({ data: null, loading: false, error: errorObj });

        if (throwOnError) {
          throw error;
        }

        return null;
      }
    },
    [handleError, withRetry]
  );

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
  };
}

/**
 * Hook for POST requests (convenience wrapper)
 */
export function useApiPost<TResponse = unknown, TBody = unknown>() {
  const { execute, ...rest } = useApiCall<TResponse>();

  const post = useCallback(
    (url: string, body: TBody, options?: ApiCallOptions) => {
      return execute(
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        options
      );
    },
    [execute]
  );

  return { post, ...rest };
}

/**
 * Hook for PUT requests (convenience wrapper)
 */
export function useApiPut<TResponse = unknown, TBody = unknown>() {
  const { execute, ...rest } = useApiCall<TResponse>();

  const put = useCallback(
    (url: string, body: TBody, options?: ApiCallOptions) => {
      return execute(
        fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        options
      );
    },
    [execute]
  );

  return { put, ...rest };
}

/**
 * Hook for DELETE requests (convenience wrapper)
 */
export function useApiDelete<TResponse = unknown>() {
  const { execute, ...rest } = useApiCall<TResponse>();

  const del = useCallback(
    (url: string, options?: ApiCallOptions) => {
      return execute(
        fetch(url, {
          method: 'DELETE',
        }),
        options
      );
    },
    [execute]
  );

  return { delete: del, ...rest };
}

/**
 * Hook for GET requests (convenience wrapper)
 */
export function useApiGet<TResponse = unknown>() {
  const { execute, ...rest } = useApiCall<TResponse>();

  const get = useCallback(
    (url: string, options?: ApiCallOptions) => {
      return execute(fetch(url), options);
    },
    [execute]
  );

  return { get, ...rest };
}
