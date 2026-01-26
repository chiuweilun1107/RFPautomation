import { useState, useCallback, useMemo } from 'react';

/**
 * 源文献多选管理 Hook
 * 统一管理源文献的选择、全选、清空、搜索过滤
 */
export function useSourceSelection<T extends { id: string; title?: string; content?: string }>(sources: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // 选择/取消选择单个源
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 全选
  const selectAll = useCallback(() => {
    const newSet = new Set(sources.map((s) => s.id));
    setSelectedIds(newSet);
  }, [sources]);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 批量设置选择
  const setSelection = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  // 反选
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sources.length && sources.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, sources.length, selectAll, clearSelection]);

  // 获取选中的源
  const selectedSources = useMemo(() => {
    return sources.filter((s) => selectedIds.has(s.id));
  }, [sources, selectedIds]);

  // 源的搜索和过滤
  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const query = searchQuery.toLowerCase();
    return sources.filter((source) => {
      const title = source.title?.toLowerCase() || '';
      const content = source.content?.toLowerCase() || '';
      return title.includes(query) || content.includes(query);
    });
  }, [sources, searchQuery]);

  // 过滤后的选中数
  const selectedCount = useMemo(() => {
    return filteredSources.filter((s) => selectedIds.has(s.id)).length;
  }, [filteredSources, selectedIds]);

  return {
    // 状态
    selectedIds,
    selectedSources,
    filteredSources,
    searchQuery,

    // 计算值
    isAllSelected: selectedIds.size === sources.length && sources.length > 0,
    selectedCount,
    filteredCount: filteredSources.length,

    // 操作函数
    toggleSelection,
    selectAll,
    clearSelection,
    setSelection,
    toggleSelectAll,
    setSearchQuery,

    // 便利函数：清空搜索
    clearSearch: () => setSearchQuery(''),

    // 便利函数：获取选中的 IDs 数组
    getSelectedIds: () => Array.from(selectedIds),

    // 便利函数：是否选中指定源
    isSelected: (id: string) => selectedIds.has(id),
  };
}
