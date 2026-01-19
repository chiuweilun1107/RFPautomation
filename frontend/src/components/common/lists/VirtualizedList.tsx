"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";

export interface VirtualizedListProps<T> {
  /** 列表项数据 */
  items: T[];
  /** 渲染单个列表项 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** 提取项的唯一 key */
  keyExtractor: (item: T, index: number) => string;
  /** 项被选中时的回调 */
  onSelect?: (item: T) => void;
  /** 虚拟滚动的阈值（项数超过此值时启用） */
  virtualizeThreshold?: number;
  /** 是否支持搜索 */
  searchable?: boolean;
  /** 搜索查询 */
  searchQuery?: string;
  /** 搜索查询变化回调 */
  onSearchChange?: (query: string) => void;
  /** 自定义过滤函数 */
  filterFn?: (item: T, query: string) => boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 空状态内容 */
  emptyState?: React.ReactNode;
  /** 单个列表项的高度（用于虚拟化计算） */
  itemHeight?: number;
  /** 容器类名 */
  className?: string;
  /** 列表容器的最大高度 */
  maxHeight?: string;
}

/**
 * 虚拟化列表组件
 * 自动在项数超过阈值时启用虚拟滚动，优化性能
 * 支持搜索、过滤、加载状态
 *
 * @example
 * <VirtualizedList
 *   items={items}
 *   renderItem={(item) => <ItemCard {...item} />}
 *   keyExtractor={(item) => item.id}
 *   searchable
 *   filterFn={(item, query) => item.name.toLowerCase().includes(query.toLowerCase())}
 * />
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  keyExtractor,
  onSelect,
  virtualizeThreshold = 50,
  searchable = false,
  searchQuery: externalQuery = "",
  onSearchChange,
  filterFn,
  loading = false,
  emptyState,
  itemHeight = 64,
  className = "",
  maxHeight = "max-h-[500px]",
}: VirtualizedListProps<T>) {
  const [internalQuery, setInternalQuery] = useState(externalQuery);
  const searchQuery = externalQuery !== undefined ? externalQuery : internalQuery;

  const handleSearchChange = useCallback(
    (query: string) => {
      setInternalQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  const clearSearch = useCallback(() => {
    handleSearchChange("");
  }, [handleSearchChange]);

  // 过滤项
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim() || !filterFn) return items;
    return items.filter((item) => filterFn(item, searchQuery));
  }, [items, searchQuery, filterFn]);

  // 是否启用虚拟化
  const shouldVirtualize = filteredItems.length > virtualizeThreshold;

  // 虚拟化器
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredItems.length : 0,
    size: itemHeight,
    overscan: 10,
    getScrollElement: () => document.querySelector("[data-virtual-scroll-container]"),
  });

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : [];
  const paddingTop = shouldVirtualize ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom = shouldVirtualize
    ? (filteredItems.length - (virtualItems[virtualItems.length - 1]?.index ?? 0)) *
      itemHeight
    : 0;

  // 渲染的项
  const itemsToRender = shouldVirtualize
    ? virtualItems.map((virtualItem) => ({
        ...virtualItem,
        item: filteredItems[virtualItem.index],
        index: virtualItem.index,
      }))
    : filteredItems.map((item, index) => ({
        item,
        index,
      }));

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* 搜索栏 */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1.5 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* 列表容器 */}
      {!loading && filteredItems.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {emptyState || "没有项目"}
        </div>
      ) : (
        <div
          data-virtual-scroll-container
          className={`overflow-y-auto overflow-x-hidden ${maxHeight} border border-gray-200 dark:border-gray-700 rounded-md`}
        >
          {shouldVirtualize ? (
            <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
              <div style={{ paddingTop, paddingBottom }}>
                {itemsToRender.map(({ item, index, size }) => (
                  <div
                    key={keyExtractor(item, index)}
                    data-index={index}
                    onClick={() => onSelect?.(item)}
                    style={{
                      height: `${itemHeight}px`,
                    }}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    {renderItem(item, index)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {itemsToRender.map(({ item, index }) => (
                <div
                  key={keyExtractor(item, index)}
                  onClick={() => onSelect?.(item)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors p-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 简化版的虚拟化列表（仅展示，不支持交互）
 */
export function SimpleVirtualizedList<T>({
  items,
  renderItem,
  keyExtractor,
  virtualizeThreshold = 50,
  itemHeight = 64,
  className = "",
}: Omit<
  VirtualizedListProps<T>,
  "onSelect" | "searchable" | "onSearchChange" | "filterFn" | "loading" | "emptyState"
>) {
  return (
    <VirtualizedList
      items={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      virtualizeThreshold={virtualizeThreshold}
      itemHeight={itemHeight}
      className={className}
      loading={false}
    />
  );
}
