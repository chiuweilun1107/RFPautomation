"use client";

import React, { useRef, useEffect } from "react";
import { VirtualizedList, VirtualizedListProps } from "./VirtualizedList";
import {
  getListItemAriaProps,
  generateId,
  setFocus,
} from "@/lib/a11y/aria-helpers";
import { useEventListener } from "@/hooks";

interface AccessibleListProps<T> extends Omit<VirtualizedListProps<T>, "renderItem"> {
  /** List 的唯一 ID */
  listId?: string;
  /** 自定义渲染项函数（接收额外的 ARIA props） */
  renderItem: (
    item: T,
    index: number,
    ariaProps: Record<string, any>
  ) => React.ReactNode;
  /** 当前选中项 ID */
  selectedItemId?: string;
  /** 项被选中时的回调 */
  onSelectItem?: (item: T, index: number) => void;
  /** 支持键盘导航（上下箭头） */
  keyboardNavigation?: boolean;
}

/**
 * 无障碍 List 组件
 * 支持：
 * - ARIA 列表项角色和属性
 * - 键盘导航（上下箭头、Home、End 等）
 * - 屏幕阅读器宣布
 * - 焦点管理
 *
 * @example
 * <AccessibleList
 *   items={items}
 *   renderItem={(item, index, ariaProps) => (
 *     <div {...ariaProps} onClick={() => onSelectItem(item)}>
 *       {item.name}
 *     </div>
 *   )}
 *   selectedItemId={selectedId}
 *   keyboardNavigation
 * />
 */
export function AccessibleList<T extends { id: string }>({
  items = [],
  renderItem,
  listId: customListId,
  selectedItemId,
  onSelectItem,
  keyboardNavigation = true,
  ...props
}: AccessibleListProps<T>) {
  const listId = customListId || generateId("list");
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  // 处理键盘导航
  useEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (!keyboardNavigation || !listRef.current) return;

      const maxIndex = items.length - 1;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, maxIndex)));
          break;

        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) => (prev === null ? maxIndex : Math.max(prev - 1, 0)));
          break;

        case "Home":
          event.preventDefault();
          setFocusedIndex(0);
          break;

        case "End":
          event.preventDefault();
          setFocusedIndex(maxIndex);
          break;

        case "Enter":
        case " ":
          if (focusedIndex !== null && focusedIndex >= 0 && focusedIndex < items.length) {
            event.preventDefault();
            const item = items[focusedIndex];
            onSelectItem?.(item, focusedIndex);
          }
          break;

        default:
          break;
      }
    },
    listRef.current || undefined
  );

  // 焦点移动到选中的项
  useEffect(() => {
    if (focusedIndex !== null && focusedIndex >= 0 && focusedIndex < items.length) {
      const item = items[focusedIndex];
      const element = itemRefs.current.get(item.id);

      if (element) {
        setFocus(element);
      }
    }
  }, [focusedIndex, items]);

  return (
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={props.searchable ? "可搜索列表" : "列表"}
      {...(props.emptyState && { "aria-describedby": "list-empty-state" })}
    >
      <VirtualizedList
        {...props}
        items={items}
        renderItem={(item, index) => {
          const ariaProps = getListItemAriaProps(
            item.id,
            selectedItemId ? selectedItemId === item.id : focusedIndex === index
          );

          return (
            <div
              {...ariaProps}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(item.id, el);
                } else {
                  itemRefs.current.delete(item.id);
                }
              }}
              onClick={() => {
                setFocusedIndex(index);
                onSelectItem?.(item, index);
              }}
            >
              {renderItem(item, index, ariaProps)}
            </div>
          );
        }}
      />
    </div>
  );
}

/**
 * 无障碍树组件
 * 支持嵌套项、展开/折叠、键盘导航
 */
export interface TreeItemAriaProps {
  id: string;
  role: "treeitem";
  "aria-expanded": boolean | undefined;
  "aria-level": number;
}

interface AccessibleTreeProps<T extends { id: string; children?: T[] }> {
  /** 树数据 */
  items: T[];
  /** 渲染项的函数 */
  renderItem: (
    item: T,
    ariaProps: TreeItemAriaProps,
    depth: number
  ) => React.ReactNode;
  /** 展开的项 ID */
  expandedIds: Set<string>;
  /** 项展开状态变化回调 */
  onToggleExpand: (itemId: string) => void;
  /** 树的标签 */
  label?: string;
}

/**
 * 无障碍树组件
 * @example
 * <AccessibleTree
 *   items={items}
 *   renderItem={(item, ariaProps, depth) => (
 *     <div {...ariaProps}>
 *       <button onClick={() => onToggleExpand(item.id)}>
 *         {item.name}
 *       </button>
 *     </div>
 *   )}
 *   expandedIds={expandedIds}
 *   onToggleExpand={toggleExpand}
 * />
 */
export function AccessibleTree<T extends { id: string; children?: T[] }>({
  items,
  renderItem,
  expandedIds,
  onToggleExpand,
  label = "树",
}: AccessibleTreeProps<T>) {
  const treeId = generateId("tree");

  const renderTreeItem = (item: T, depth: number = 1): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    const ariaProps: TreeItemAriaProps = {
      id: item.id,
      role: "treeitem",
      "aria-expanded": hasChildren ? isExpanded : undefined,
      "aria-level": depth,
    };

    return (
      <div key={item.id}>
        <div onClick={() => hasChildren && onToggleExpand(item.id)}>
          {renderItem(item, ariaProps, depth)}
        </div>

        {hasChildren && isExpanded && (
          <div role="group" aria-label={`${(item as any).name || "项"} 的子项`}>
            {item.children!.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div id={treeId} role="tree" aria-label={label}>
      {items.map((item) => renderTreeItem(item))}
    </div>
  );
}
