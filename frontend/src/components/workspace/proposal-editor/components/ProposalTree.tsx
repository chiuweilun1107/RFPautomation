'use client';

import type { ProposalTreeProps } from '../types';

/**
 * 树形结构渲染组件
 */
export function ProposalTree({
  sections,
  loading,
  onDragEnd,
  expandedSections,
  onToggleExpand,
}: ProposalTreeProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse ml-8" />
        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p>No structure defined yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* TODO: 渲染树形结构，使用 DndContext 和 SortableContext */}
      <p>Tree rendering - TBD</p>
    </div>
  );
}
