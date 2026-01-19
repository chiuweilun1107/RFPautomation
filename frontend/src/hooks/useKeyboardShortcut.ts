import { useEffect } from 'react';

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface UseKeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts
 *
 * @param options - Keyboard shortcut configuration
 * @param handler - Function to call when shortcut is triggered
 *
 * @example
 * useKeyboardShortcut({ key: 'Escape' }, () => closeDialog());
 * useKeyboardShortcut({ key: 'k', ctrlKey: true }, () => openSearch());
 */
export function useKeyboardShortcut(
  options: UseKeyboardShortcutOptions,
  handler: KeyboardShortcutHandler
) {
  const { key, ctrlKey, shiftKey, altKey, metaKey, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchesKey = event.key === key;
      const matchesCtrl = ctrlKey === undefined || event.ctrlKey === ctrlKey;
      const matchesShift = shiftKey === undefined || event.shiftKey === shiftKey;
      const matchesAlt = altKey === undefined || event.altKey === altKey;
      const matchesMeta = metaKey === undefined || event.metaKey === metaKey;

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, ctrlKey, shiftKey, altKey, metaKey, enabled, handler]);
}
