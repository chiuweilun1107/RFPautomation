"use client";

import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";

interface SectionHeaderProps {
    title: string;
    depth: number;
    isExpanded: boolean;
    taskCount: number;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

/**
 * 章节头部 - 显示章节标题和操作按钮
 */
export function SectionHeader({
    title,
    depth,
    isExpanded,
    taskCount,
    onToggleExpand,
    onEdit,
    onDelete,
}: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group">
            {/* Expand button */}
            <button
                onClick={onToggleExpand}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded flex-shrink-0"
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </button>

            {/* Folder icon */}
            <FolderOpen className={`w-4 h-4 flex-shrink-0 ${
                depth > 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
            }`} />

            {/* Title and task count */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {title}
                </div>
                {taskCount > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {taskCount} task{taskCount !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onEdit}
                    className="h-7 w-7 p-0"
                >
                    <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    className="h-7 w-7 p-0 hover:text-red-600"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
