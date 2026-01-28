/**
 * React Query Mutation with Unified Error Handling
 *
 * Wraps useMutation with automatic error handling:
 * - Consistent error logging
 * - User-friendly error notifications
 * - Success toast messages
 * - Automatic retry for retryable errors
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useMutationWithError({
 *   mutationFn: (data: ProjectData) => createProject(data),
 *   context: 'CreateProject',
 *   successMessage: 'Project created successfully!',
 *   onSuccess: () => queryClient.invalidateQueries(['projects']),
 * });
 * ```
 */

import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useErrorHandler, ErrorHandlerOptions } from './useErrorHandler';

export interface MutationWithErrorOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onError' | 'onSuccess'> {
  /** Context for error logging (e.g., 'CreateProject') */
  context: string;
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast (overrides extracted message) */
  errorMessage?: string;
  /** Whether to show success toast (default: true if successMessage provided) */
  showSuccessToast?: boolean;
  /** Whether to show error toast (default: true) */
  showErrorToast?: boolean;
  /** Additional metadata for error logging */
  errorMetadata?: Record<string, unknown>;
  /** Custom success handler (called after default success handling) */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
  /** Custom error handler (called after default error handling) */
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
  /** Query keys to invalidate on success */
  invalidateQueries?: string[][];
  /** Whether to enable automatic retry for retryable errors (default: false) */
  enableRetry?: boolean;
}

/**
 * Hook for mutations with unified error handling
 */
export function useMutationWithError<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: MutationWithErrorOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    context,
    successMessage,
    errorMessage,
    showSuccessToast = !!successMessage,
    showErrorToast = true,
    errorMetadata = {},
    invalidateQueries = [],
    enableRetry = false,
    onSuccess: customOnSuccess,
    onError: customOnError,
    mutationFn,
    ...mutationOptions
  } = options;

  const { handleError, withRetry } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,

    mutationFn: enableRetry && mutationFn
      ? async (variables: TVariables, mutationContext: any) => {
          return withRetry(
            () => mutationFn(variables, mutationContext),
            {
              context,
              showToast: false, // We'll handle toast in onError
            }
          );
        }
      : mutationFn,

    onSuccess: async (data, variables, ctx) => {
      // Show success toast
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      // Invalidate queries
      if (invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map(queryKey =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }

      // Call custom success handler
      if (customOnSuccess) {
        await customOnSuccess(data, variables, ctx);
      }
    },

    onError: async (error, variables, ctx) => {
      // Handle error with unified error handler
      const errorOptions: ErrorHandlerOptions = {
        context,
        userMessage: errorMessage,
        metadata: {
          ...errorMetadata,
          variables,
        },
        showToast: showErrorToast,
      };

      handleError(error, errorOptions);

      // Call custom error handler
      if (customOnError) {
        await customOnError(error, variables, ctx);
      }
    },
  });
}

/**
 * Hook for queries with unified error handling
 */
export interface QueryWithErrorOptions extends ErrorHandlerOptions {
  /** Whether to show error toast when query fails (default: true) */
  showErrorToast?: boolean;
  /** Custom error message for query failures */
  errorMessage?: string;
}

export function useQueryErrorOptions(
  context: string,
  options: QueryWithErrorOptions = {}
) {
  const { handleError } = useErrorHandler();

  const {
    showErrorToast = true,
    errorMessage,
    metadata = {},
    ...restOptions
  } = options;

  return {
    onError: (error: unknown) => {
      handleError(error, {
        context,
        userMessage: errorMessage || 'Failed to load data. Please try again.',
        metadata,
        showToast: showErrorToast,
        ...restOptions,
      });
    },
  };
}

/**
 * Create a mutation that automatically invalidates related queries
 */
export function useInvalidatingMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryKeysToInvalidate: string[][],
  options: Omit<MutationWithErrorOptions<TData, TError, TVariables, unknown>, 'mutationFn' | 'invalidateQueries'> = {
    context: 'Mutation',
  }
) {
  return useMutationWithError<TData, TError, TVariables>({
    mutationFn,
    invalidateQueries: queryKeysToInvalidate,
    ...options,
  });
}
