/**
 * TaskItem Component
 *
 * Displays a single task in a section's task list.
 * Clicking opens the detailed task view in a draggable popup.
 */

import { useState, memo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { DraggableTaskPopup } from "./DraggableTaskPopup";
import type { Task, Section } from "../types";

interface TaskItemProps {
    /** Task data to display */
    task: Task;
    /** Parent section for context */
    section: Section;
    /** Content generation handler */
    handleGenerateContent: (task: any, section: any) => void;
}

/**
 * Render task summary, handling both string and structured data
 */
const renderSummary = (text: any): string => {
    if (typeof text === 'string') return text;
    try {
        const str = JSON.stringify(text);
        return str.length > 100 ? str.slice(0, 100) + '...' : str;
    } catch (e) {
        return '[Structured Data]';
    }
};

/**
 * Clickable task list item with status badge and pre-fetching
 */
function TaskItemComponent({ task, section, handleGenerateContent }: TaskItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [prefetchedContent, setPrefetchedContent] = useState<string | null>(null);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const supabase = createClient();

    // Prefetch content on hover
    const prefetchContent = async () => {
        if (prefetchedContent || isPrefetching || !task?.id) return;
        setIsPrefetching(true);
        try {
            const { data } = await supabase
                .from('task_contents')
                .select('content')
                .eq('task_id', task.id)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            if (data?.content) {
                setPrefetchedContent(data.content);
            }
        } catch (err) {
            // Silently ignore prefetch errors
        } finally {
            setIsPrefetching(false);
        }
    };

    return (
        <>
            <div
                onClick={() => setIsOpen(true)}
                onMouseEnter={prefetchContent}
                className="pl-4 border-l-2 border-black/5 dark:border-white/5 py-2 text-xs group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-r-sm"
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1">
                        <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-black/80 dark:text-white/80 line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="whitespace-pre-wrap font-medium">
                                {renderSummary(task.requirement_text)}
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={cn(
                            "text-[9px] uppercase font-bold px-1.5 py-0.5 border",
                            task.status === 'pending' ? 'bg-yellow-100/50 text-yellow-700 border-yellow-200' :
                                task.status === 'approved' ? 'bg-green-100/50 text-green-700 border-green-200' :
                                    'bg-zinc-100 text-zinc-500 border-zinc-200'
                        )}>
                            {task.status}
                        </span>
                    </div>
                </div>
            </div>

            <DraggableTaskPopup
                task={task}
                section={section}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                handleGenerateContent={handleGenerateContent}
                initialContent={prefetchedContent}
            />
        </>
    );
}

/**
 * Memoized TaskItem to prevent re-renders when task data hasn't changed
 */
export const TaskItem = memo(
    TaskItemComponent,
    (prevProps, nextProps) => {
        // Only re-render if task ID, requirement text, or status changes
        return (
            prevProps.task.id === nextProps.task.id &&
            prevProps.task.requirement_text === nextProps.task.requirement_text &&
            prevProps.task.status === nextProps.task.status
        );
    }
);
