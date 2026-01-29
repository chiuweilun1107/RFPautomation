import { useState, useCallback, useEffect, useRef } from 'react';
import type { Position } from '@/hooks';

/**
 * 面板大小定义
 */
export interface PanelSize {
  width: number;
  height: number;
}

/**
 * 单个面板的状态
 */
export interface PanelState {
  position: Position;
  size: PanelSize;
  isExpanded: boolean;
}

/**
 * useMultiPanelDrag 配置选项
 */
export interface UseMultiPanelDragOptions {
  /** 默认面板宽度 */
  defaultWidth?: number;
  /** 默认面板高度 */
  defaultHeight?: number;
  /** 计算初始位置的函数 */
  getInitialPosition?: (index: number) => Position;
}

/**
 * useMultiPanelDrag 返回类型
 */
export interface UseMultiPanelDragReturn {
  /** 所有面板状态 */
  panelStates: Map<string, PanelState>;
  /** 当前正在拖拽的面板 ID */
  draggingId: string | null;
  /** 开始拖拽 */
  startDrag: (e: React.MouseEvent, panelId: string) => void;
  /** 切换面板展开状态 */
  toggleExpand: (panelId: string) => void;
  /** 获取面板样式 */
  getPanelStyle: (panelId: string, index: number) => React.CSSProperties;
  /** 获取面板状态（带默认值） */
  getPanelState: (panelId: string, index: number) => PanelState;
}

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 500;

/**
 * 管理多个可拖拽面板的状态
 *
 * 提供统一的拖拽逻辑管理，支持：
 * - 多面板独立位置追踪
 * - 面板展开/收缩状态
 * - 全局鼠标事件处理
 *
 * @example
 * ```tsx
 * const {
 *   draggingId,
 *   startDrag,
 *   toggleExpand,
 *   getPanelStyle,
 * } = useMultiPanelDrag();
 *
 * return panels.map((panel, index) => (
 *   <div style={getPanelStyle(panel.id, index)}>
 *     <div onMouseDown={(e) => startDrag(e, panel.id)}>
 *       Drag Handle
 *     </div>
 *   </div>
 * ));
 * ```
 */
export function useMultiPanelDrag(
  options: UseMultiPanelDragOptions = {}
): UseMultiPanelDragReturn {
  const {
    defaultWidth = DEFAULT_WIDTH,
    defaultHeight = DEFAULT_HEIGHT,
    getInitialPosition,
  } = options;

  // 所有面板的状态
  const [panelStates, setPanelStates] = useState<Map<string, PanelState>>(
    new Map()
  );

  // 当前拖拽状态
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  /**
   * 获取面板初始位置
   */
  const getDefaultPosition = useCallback(
    (index: number): Position => {
      if (getInitialPosition) {
        return getInitialPosition(index);
      }
      // 默认位置：右侧堆叠
      return {
        x: typeof window !== 'undefined' ? window.innerWidth - defaultWidth - 20 : 0,
        y: 80 + index * 60,
      };
    },
    [getInitialPosition, defaultWidth]
  );

  /**
   * 获取面板状态（如果不存在则返回默认值）
   */
  const getPanelState = useCallback(
    (panelId: string, index: number): PanelState => {
      const existing = panelStates.get(panelId);
      if (existing) return existing;

      return {
        position: getDefaultPosition(index),
        size: { width: defaultWidth, height: defaultHeight },
        isExpanded: false,
      };
    },
    [panelStates, getDefaultPosition, defaultWidth, defaultHeight]
  );

  /**
   * 开始拖拽面板
   */
  const startDrag = useCallback(
    (e: React.MouseEvent, panelId: string) => {
      e.preventDefault();

      const panel = document.getElementById(`panel-${panelId}`);
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      setDraggingId(panelId);
    },
    []
  );

  /**
   * 切换面板展开状态
   */
  const toggleExpand = useCallback((panelId: string) => {
    setPanelStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(panelId);

      if (current) {
        newStates.set(panelId, {
          ...current,
          isExpanded: !current.isExpanded,
        });
      } else {
        // 如果面板状态不存在，创建新状态并设置为展开
        newStates.set(panelId, {
          position: { x: 0, y: 0 },
          size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
          isExpanded: true,
        });
      }

      return newStates;
    });
  }, []);

  /**
   * 获取面板的样式对象
   */
  const getPanelStyle = useCallback(
    (panelId: string, index: number): React.CSSProperties => {
      const state = getPanelState(panelId, index);
      const { position, size, isExpanded } = state;

      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isExpanded ? '90vw' : `${size.width}px`,
        height: isExpanded ? '90vh' : `${size.height}px`,
        maxWidth: isExpanded ? '1200px' : 'none',
        cursor: draggingId === panelId ? 'grabbing' : 'auto',
      };
    },
    [getPanelState, draggingId]
  );

  /**
   * 处理全局鼠标移动事件
   */
  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition: Position = {
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      };

      setPanelStates((prev) => {
        const newStates = new Map(prev);
        const current = newStates.get(draggingId);

        if (current) {
          newStates.set(draggingId, {
            ...current,
            position: newPosition,
          });
        } else {
          // 创建新状态
          newStates.set(draggingId, {
            position: newPosition,
            size: { width: defaultWidth, height: defaultHeight },
            isExpanded: false,
          });
        }

        return newStates;
      });
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, defaultWidth, defaultHeight]);

  return {
    panelStates,
    draggingId,
    startDrag,
    toggleExpand,
    getPanelStyle,
    getPanelState,
  };
}

export default useMultiPanelDrag;
