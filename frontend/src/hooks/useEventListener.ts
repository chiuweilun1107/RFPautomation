import { useEffect, useRef } from 'react';

/**
 * 自动管理事件监听器生命周期的 Hook
 * 自动在 unmount 时清理监听器，防止内存泄漏
 *
 * @example
 * useEventListener('resize', handleResize, window);
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (this: Window, ev: WindowEventMap[K]) => any,
  element?: EventTarget | null
) {
  const savedHandler = useRef(handler);

  // 更新保存的处理器引用（避免在依赖数组中包含它）
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    // 创建包装器以便调用 savedHandler.current
    const eventListener = (event: Event) => savedHandler.current.call(window, event as any);

    element.addEventListener(eventName as string, eventListener);

    // 清理函数：移除监听器
    return () => {
      element.removeEventListener(eventName as string, eventListener);
    };
  }, [eventName, element]);
}

/**
 * Document 事件监听器的便利方法
 */
export function useDocumentEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (this: Document, ev: DocumentEventMap[K]) => any
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: Event) => savedHandler.current.call(document, event as any);
    document.addEventListener(eventName as string, eventListener);
    return () => {
      document.removeEventListener(eventName as string, eventListener);
    };
  }, [eventName]);
}

/**
 * 通用事件监听器 Hook（支持任何事件目标）
 */
export function useOnEvent<T extends EventTarget>(
  target: T | null | undefined,
  eventName: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const eventListener = (event: Event) => savedHandler.current(event);
    target.addEventListener(eventName, eventListener, options);

    return () => {
      target.removeEventListener(eventName, eventListener, options);
    };
  }, [target, eventName, options]);
}
