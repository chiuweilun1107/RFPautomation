import { useCallback, useState, useRef } from 'react';

interface AsyncActionState {
  loading: boolean;
  error: Error | null;
  data: any;
  isSuccess: boolean;
}

/**
 * 异步操作管理 Hook
 * 统一管理加载、错误、成功状态、重试逻辑
 *
 * @example
 * const { execute, loading, error, data } = useAsyncAction(fetchData);
 * const result = await execute();
 */
export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    autoReset?: boolean;
  } = {}
) {
  const { onSuccess, onError, autoReset = true } = options;

  const [state, setState] = useState<AsyncActionState>({
    loading: false,
    error: null,
    data: null,
    isSuccess: false,
  });

  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setState({ loading: true, error: null, data: null, isSuccess: false });

      try {
        const result = await action(...args);
        setState({
          loading: false,
          error: null,
          data: result,
          isSuccess: true,
        });
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          loading: false,
          error,
          data: null,
          isSuccess: false,
        });
        onError?.(error);
        throw error;
      } finally {
        if (autoReset) {
          retryCountRef.current = 0;
        }
      }
    },
    [action, onSuccess, onError, autoReset]
  );

  const retry = useCallback(
    async (...args: Parameters<T>) => {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        // 指数退避
        const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return execute(...args);
      } else {
        throw new Error('Max retries exceeded');
      }
    },
    [execute]
  );

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null,
      isSuccess: false,
    });
    retryCountRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    retryCount: retryCountRef.current,
    canRetry: retryCountRef.current < maxRetries,
  };
}

/**
 * 多个异步操作的管理（如 Promise.all 的状态管理）
 */
export function useAsyncActions(
  actions: Record<string, () => Promise<any>>
) {
  const [states, setStates] = useState<
    Record<string, AsyncActionState>
  >({});

  const execute = useCallback(
    async (keys: string[]) => {
      const results: Record<string, any> = {};
      const errors: Record<string, Error> = {};

      // 初始化状态
      keys.forEach((key) => {
        setStates((prev) => ({
          ...prev,
          [key]: { loading: true, error: null, data: null, isSuccess: false },
        }));
      });

      // 并行执行
      await Promise.allSettled(
        keys.map(async (key) => {
          try {
            const result = await actions[key]?.();
            results[key] = result;
            setStates((prev) => ({
              ...prev,
              [key]: {
                loading: false,
                error: null,
                data: result,
                isSuccess: true,
              },
            }));
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            errors[key] = error;
            setStates((prev) => ({
              ...prev,
              [key]: {
                loading: false,
                error,
                data: null,
                isSuccess: false,
              },
            }));
          }
        })
      );

      return { results, errors };
    },
    [actions]
  );

  return { states, execute };
}
