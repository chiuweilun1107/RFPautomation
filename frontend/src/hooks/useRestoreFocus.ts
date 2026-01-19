import { useEffect, useRef } from 'react';

/**
 * Hook to restore focus to the trigger element when a dialog/modal closes
 * This is important for keyboard navigation UX
 *
 * @param isOpen - Whether the dialog is currently open
 */
export function useRestoreFocus(isOpen: boolean) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element when dialog opens
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else {
      // Restore focus when dialog closes
      if (previousActiveElement.current) {
        // Use setTimeout to ensure the dialog has fully closed
        setTimeout(() => {
          previousActiveElement.current?.focus();
        }, 0);
      }
    }
  }, [isOpen]);
}
