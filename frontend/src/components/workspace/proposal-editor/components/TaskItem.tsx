"use client";

import { useState } from "react";
import { Task } from "../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Trash2, Sparkles, Check, X } from "lucide-react";

interface TaskItemProps {
    task: Task;
    sectionId: string;
    isExpanded: boolean;
    isEditing: boolean;
    editValue: string;
    isGenerating: boolean;
    onToggleExpand: () => void;
    onStartEdit: () => void;
    onSaveEdit: (value: string) => void;
    onCancelEdit: () => void;
    onUpdateValue: (value: string) => void;
    onDelete: () => void;
    onGenerateContent: () => void;
}

/**
 * 单个任务项组件 - 展示和编辑任务
 */
export function TaskItem({
    task,
    sectionId,
    isExpanded,
    isEditing,
    editValue,
    isGenerating,
    onToggleExpand,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onUpdateValue,
    onDelete,
    onGenerateContent,
}: TaskItemProps) {
    return (
        <div className="py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            <div className="flex items-center gap-1 min-h-8">
                {/* Expand toggle */}
                <button
                    onClick={onToggleExpand}
                    className="p-0 hover:bg-gray-200 dark:hover:bg-gray-800 rounded flex-shrink-0"
                >
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </button>

                {/* Task content or edit mode */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex gap-1">
                            <Input
                                value={editValue}
                                onChange={(e) => onUpdateValue(e.target.value)}
                                className="h-8 text-sm flex-1"
                                placeholder="Task requirement"
                                autoFocus
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSaveEdit(editValue)}
                                className="h-8 px-2"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onCancelEdit}
                                className="h-8 px-2"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div
                            onClick={onStartEdit}
                            className="text-sm truncate cursor-pointer text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {task.requirement_text || "Untitled task"}
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                {!isEditing && (
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onGenerateContent}
                            disabled={isGenerating}
                            className="h-8 px-2"
                        >
                            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onDelete}
                            className="h-8 px-2 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
