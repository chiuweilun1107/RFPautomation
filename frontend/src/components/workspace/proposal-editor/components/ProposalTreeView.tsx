"use client";

import { useMemo } from "react";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    useSensor,
    PointerSensor,
    KeyboardSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical, FolderPlus } from "lucide-react";
import { Section } from "../../types";
import { SortableNode } from "../../structure/SortableNode";

interface ProposalTreeViewProps {
    sections: Section[];
    loading: boolean;
    expandedSections: Set<string>;
    sensors: ReturnType<typeof useSensors>;
    onDragEnd: (event: DragEndEvent) => void;
    renderSection: (section: Section, depth?: number, dragHandleProps?: any) => React.ReactNode;
    onAddSection: (parentId?: string) => void;
}

/**
 * 提案树形视图组件
 * 展示和管理章节结构的拖拽排序
 */
export function ProposalTreeView({
    sections,
    loading,
    expandedSections,
    sensors,
    onDragEnd,
    renderSection,
    onAddSection,
}: ProposalTreeViewProps) {
    return (
        <div className="w-full bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Tree Content */}
            <div className="p-4 min-h-[400px]">
                {loading ? (
                    // Loading skeleton
                    <div className="space-y-3">
                        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse ml-8" />
                        <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                    </div>
                ) : sections.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <GripVertical className="w-10 h-10 mb-4 opacity-20" />
                        <p>No structure defined yet.</p>
                        <Button variant="link" onClick={() => onAddSection()}>
                            Create your first chapter
                        </Button>
                    </div>
                ) : (
                    // Tree with drag and drop
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={sections.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-1">
                                {sections.map((section) => (
                                    // @ts-ignore - renderSection has correct signature despite TypeScript inference issue
                                    <SortableNode
                                        key={section.id}
                                        section={section}
                                        depth={0}
                                        renderSection={renderSection as (section: Section, depth?: number, dragHandleProps?: any) => React.ReactNode}
                                        expandedSections={expandedSections}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
