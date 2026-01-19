import { useState, useCallback } from 'react';

/**
 * 通用 Dialog 状态管理 Hook
 * 统一管理 Dialog 的开关、输入、加载、错误状态
 *
 * @example
 * const { open, setOpen, value, setValue, loading, setLoading, error, setError, reset } = useDialog();
 */
export function useDialog<T = string>(initialValue?: T) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setLoading(false);
  }, [initialValue]);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  }, [reset]);

  return {
    // 状态
    open,
    value,
    loading,
    error,

    // 设置函数
    setOpen,
    setValue,
    setLoading,
    setError,

    // 便利方法
    reset,
    close,
    handleOpenChange,

    // 便利函数：设置错误并打开 Dialog
    setErrorAndOpen: (errorMsg: string) => {
      setError(errorMsg);
      setOpen(true);
    },

    // 便利函数：通用提交模式
    submitHandler: (
      fn: (value: T | undefined) => Promise<void>
    ) => {
      return async () => {
        try {
          setLoading(true);
          setError(null);
          await fn(value);
          close();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };
    },
  };
}

/**
 * 多个 Dialog 的批量管理
 */
export function useDialogs<K extends string>(...keys: K[]) {
  const dialogs = new Map<K, ReturnType<typeof useDialog>>();

  keys.forEach((key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    dialogs.set(key, useDialog());
  });

  return dialogs;
}
