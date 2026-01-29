import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Position coordinates for the draggable dialog
 */
export interface Position {
  /** X coordinate (left offset in pixels) */
  x: number;
  /** Y coordinate (top offset in pixels) */
  y: number;
}

/**
 * Boundary constraints for the draggable dialog
 */
export interface DraggableBounds {
  /** Minimum X position (default: 0) */
  minX?: number;
  /** Maximum X position (default: window.innerWidth - dialogWidth) */
  maxX?: number;
  /** Minimum Y position (default: 0) */
  minY?: number;
  /** Maximum Y position (default: window.innerHeight - handleHeight) */
  maxY?: number;
}

/**
 * Configuration options for the useDraggableDialog hook
 */
export interface UseDraggableDialogOptions {
  /** Initial position of the dialog */
  initialPosition?: Position;
  /** Width of the dialog for boundary calculations (default: 580) */
  dialogWidth?: number;
  /** Height of the drag handle for boundary calculations (default: 24) */
  handleHeight?: number;
  /** Custom boundary constraints */
  bounds?: DraggableBounds;
  /** Whether dragging is disabled */
  disabled?: boolean;
  /** Callback fired when dragging starts */
  onDragStart?: (position: Position) => void;
  /** Callback fired while dragging */
  onDrag?: (position: Position) => void;
  /** Callback fired when dragging ends */
  onDragEnd?: (position: Position) => void;
}

/**
 * Return type for the useDraggableDialog hook
 */
export interface UseDraggableDialogReturn {
  /** Current position of the dialog */
  position: Position;
  /** Whether the dialog is currently being dragged */
  isDragging: boolean;
  /** @deprecated Use dragListeners instead */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** Handler for pointer down */
  handlePointerDown: (e: React.PointerEvent) => void;
  /** Pre-packaged event listeners to spread onto the drag handle */
  dragListeners: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  /** Programmatically set the position */
  setPosition: (position: Position | ((prev: Position) => Position)) => void;
  /** Reset position to initial value */
  resetPosition: () => void;
  /** Style object to apply to the dialog container */
  dialogStyle: React.CSSProperties;
}

/**
 * Default configuration values
 */
const DEFAULT_INITIAL_POSITION: Position = { x: 40, y: 150 };
const DEFAULT_DIALOG_WIDTH = 580;
const DEFAULT_HANDLE_HEIGHT = 24;

/**
 * A custom hook for handling draggable dialog logic.
 *
 * This hook provides all the necessary state and event handlers for implementing
 * a draggable dialog/popup. It handles:
 * - Position state management
 * - Mouse event handling for drag operations
 * - Boundary constraints to keep the dialog within the viewport
 * - Optional callbacks for drag lifecycle events
 *
 * @param options - Configuration options for the draggable behavior
 * @returns Object containing position state, drag state, and event handlers
 *
 * @example
 * ```tsx
 * const {
 *   position,
 *   isDragging,
 *   handleMouseDown,
 *   dialogStyle
 * } = useDraggableDialog({
 *   initialPosition: { x: 100, y: 100 },
 *   dialogWidth: 600,
 * });
 *
 * return (
 *   <div style={dialogStyle}>
 *     <div
 *       onMouseDown={handleMouseDown}
 *       className="cursor-move"
 *     >
 *       Drag Handle
 *     </div>
 *     <div>Dialog Content</div>
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // With custom bounds and callbacks
 * const { position, handleMouseDown, resetPosition } = useDraggableDialog({
 *   initialPosition: { x: 50, y: 50 },
 *   bounds: {
 *     minX: 0,
 *     maxX: 800,
 *     minY: 0,
 *     maxY: 600,
 *   },
 *   onDragEnd: (pos) => {
 *     console.log('Dialog moved to:', pos);
 *   },
 * });
 * ```
 */
export function useDraggableDialog(
  options: UseDraggableDialogOptions = {}
): UseDraggableDialogReturn {
  const {
    initialPosition = DEFAULT_INITIAL_POSITION,
    dialogWidth = DEFAULT_DIALOG_WIDTH,
    handleHeight = DEFAULT_HANDLE_HEIGHT,
    bounds,
    disabled = false,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options;

  // Store initial position in a ref for reset functionality
  const initialPositionRef = useRef(initialPosition);

  // Position state
  const [position, setPosition] = useState<Position>(initialPosition);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);

  // Drag offset (distance from mouse to dialog's top-left corner)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  /**
   * Clamps a value between min and max bounds
   */
  const clamp = useCallback((value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(value, max));
  }, []);

  /**
   * Calculates the constrained position within bounds
   */
  const getConstrainedPosition = useCallback(
    (x: number, y: number): Position => {
      const minX = bounds?.minX ?? 0;
      const maxX = bounds?.maxX ?? (typeof window !== 'undefined' ? window.innerWidth - dialogWidth : Infinity);
      const minY = bounds?.minY ?? 0;
      const maxY = bounds?.maxY ?? (typeof window !== 'undefined' ? window.innerHeight - handleHeight : Infinity);

      return {
        x: clamp(x, minX, maxX),
        y: clamp(y, minY, maxY),
      };
    },
    [bounds, dialogWidth, handleHeight, clamp]
  );

  /**
   * Handler for pointer down event on the drag handle
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;

      // Prevent text selection during drag
      e.preventDefault();

      // Capture pointer to ensure we receive events even if moving outside or over iframes
      e.currentTarget.setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });

      onDragStart?.(position);
    },
    [disabled, position, onDragStart]
  );

  /**
   * Handler for pointer move event
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const rawX = e.clientX - dragOffset.x;
      const rawY = e.clientY - dragOffset.y;

      const constrainedPosition = getConstrainedPosition(rawX, rawY);
      setPosition(constrainedPosition);
      onDrag?.(constrainedPosition);
    },
    [isDragging, dragOffset, getConstrainedPosition, onDrag]
  );

  /**
   * Handler for pointer up event
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore errors if pointer was already released
      }
      onDragEnd?.(position);
    },
    [isDragging, position, onDragEnd]
  );

  /**
   * Reset position to initial value
   */
  const resetPosition = useCallback(() => {
    setPosition(initialPositionRef.current);
  }, []);

  // Remove window event listeners logic since we use pointer capture now

  /**
   * Style object to apply to the dialog container
   */
  const dialogStyle: React.CSSProperties = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transition: isDragging ? 'none' : 'all 0.2s ease-out',
    touchAction: 'none', // Critical for pointer events on touch devices
  };

  /**
   * Pre-packaged event listeners to spread onto the drag handle
   */
  const dragListeners = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  };

  return {
    position,
    isDragging,
    handleMouseDown: () => { }, // Deprecated, keeping for type layout temporarily if needed but should not be used
    handlePointerDown, // Explicit export
    dragListeners, // Recommended usage
    setPosition,
    resetPosition,
    dialogStyle,
  };
}

export default useDraggableDialog;
