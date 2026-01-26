'use client';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ProposalTreeProps } from '../types';
import { SortableNode } from '@/components/workspace/structure/SortableNode';

/**
 * 樹形結構渲染組件
 * 使用 dnd-kit 實現拖拽排序
 */
export function ProposalTree({
  sections,
  loading,
  expandedSections,
  sensors,
  onDragEnd,
  renderSection,
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
        <p>尚未定義結構。點擊上方按鈕開始創建。</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="space-y-1">
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SortableNode
              key={section.id}
              section={section}
              depth={0}
              renderSection={renderSection || (() => null)}
              expandedSections={expandedSections}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
