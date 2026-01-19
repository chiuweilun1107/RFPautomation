"use client";

import { Task } from "../../types";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
    tasks: Task[];
    sectionId: string;
    expandedTaskIds: Set<string>;
    inlineEditingTaskId: string | null;
    inlineTaskValue: string;
    generatingTaskId: string | null;
    onToggleExpand: (taskId: string) => void;
    onStartEdit: (task: Task) => void;
    onSaveEdit: (value: string) => void;
    onCancelEdit: () => void;
    onUpdateValue: (value: string) => void;
    onDelete: (taskId: string) => void;
    onGenerateContent: (taskId: string) => void;
}

/**
 * 任务列表组件 - 展示特定章节下的所有任务
 */
export function TaskList({
    tasks,
    sectionId,
    expandedTaskIds,
    inlineEditingTaskId,
    inlineTaskValue,
    generatingTaskId,
    onToggleExpand,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onUpdateValue,
    onDelete,
    onGenerateContent,
}: TaskListProps) {
    if (!tasks || tasks.length === 0) {
        return <div className="text-sm text-gray-400 py-2">No tasks yet</div>;
    }

    return (
        <div className="space-y-1 pl-2 border-l border-gray-200 dark:border-gray-800">
            {tasks.map((task) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    sectionId={sectionId}
                    isExpanded={expandedTaskIds.has(task.id)}
                    isEditing={inlineEditingTaskId === task.id}
                    editValue={inlineTaskValue}
                    isGenerating={generatingTaskId === task.id}
                    onToggleExpand={() => onToggleExpand(task.id)}
                    onStartEdit={() => onStartEdit(task)}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                    onUpdateValue={onUpdateValue}
                    onDelete={() => onDelete(task.id)}
                    onGenerateContent={() => onGenerateContent(task.id)}
                />
            ))}
        </div>
    );
}
