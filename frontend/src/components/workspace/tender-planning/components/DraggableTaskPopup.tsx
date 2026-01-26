/**
 * DraggableTaskPopup Component
 *
 * Full-screen draggable modal displaying detailed task information.
 * Features copy-to-clipboard and download functionality for task requirements.
 */

import * as React from "react";
import { memo } from "react";
import { GripVertical, Plus, Copy, Check, Download } from "lucide-react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "../types";

interface DraggableTaskPopupProps {
    /** Task data to display */
    task: Task;
    /** Whether the popup is visible */
    isOpen: boolean;
    /** Callback to close the popup */
    onClose: () => void;
}

/**
 * Render requirement text safely, handling both string and structured data
 */
const renderRequirementText = (text: any): string => {
    if (typeof text === 'string') return text;
    try {
        return JSON.stringify(text, null, 2);
    } catch (e) {
        return String(text);
    }
};

/**
 * Brutalist-styled draggable task detail popup
 */
function DraggableTaskPopupComponent({ task, isOpen, onClose }: DraggableTaskPopupProps) {
    const nodeRef = React.useRef(null);
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        const text = typeof task.requirement_text === 'string'
            ? task.requirement_text
            : JSON.stringify(task.requirement_text, null, 2);

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const handleDownload = () => {
        const text = typeof task.requirement_text === 'string'
            ? task.requirement_text
            : JSON.stringify(task.requirement_text, null, 2);

        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-requirement-${task.id.slice(0, 8)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Download started");
    };

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
            <Draggable nodeRef={nodeRef} handle=".drag-handle">
                <div
                    ref={nodeRef}
                    className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] flex flex-col max-h-[85vh] overflow-hidden"
                >
                    {/* Header / Drag Handle */}
                    <div className="drag-handle cursor-move p-4 border-b-2 border-black dark:border-white bg-[#FA4028] text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 opacity-50" />
                            <h3 className="text-sm font-black uppercase tracking-widest font-mono italic">Task_Details_View</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5"
                                title="Copy Requirements"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="text-[10px] font-bold uppercase">Copy</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5"
                                title="Download Requirements"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Download</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-zinc-950">
                        <div className="p-8 space-y-8">
                            {/* Requirement Spec */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-black dark:bg-white" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Requirement_Spec</h4>
                                </div>
                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                    {renderRequirementText(task.requirement_text)}
                                </div>
                            </div>

                            {/* Reference */}
                            {(task.citation_quote || task.citation_source_id) && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-blue-500" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Source_Reference</h4>
                                    </div>
                                    <div className="border-2 border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-5">
                                        {task.citation_quote && (
                                            <blockquote className="text-xs italic text-zinc-600 dark:text-zinc-400 border-l-4 border-[#FA4028] pl-4 py-1 mb-4">
                                                "{task.citation_quote}"
                                            </blockquote>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="rounded-none border-2 border-blue-200 bg-white dark:bg-zinc-900 text-blue-600 font-mono text-[10px]">
                                                SOURCE: {task.citation_source_id?.slice(0, 8)}...
                                            </Badge>
                                            {task.citation_page && (
                                                <Badge variant="outline" className="rounded-none border-2 border-zinc-200 bg-white dark:bg-zinc-900 text-zinc-600 font-mono text-[10px]">
                                                    PAGE: {task.citation_page}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black/5 dark:border-white/5">
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status_Flag</span>
                                    <div className="mt-2 text-xs font-black uppercase">
                                        <span className={cn(
                                            "inline-block px-2 py-1 border-2",
                                            task.status === 'pending' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                                task.status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' :
                                                    'border-zinc-200 bg-zinc-50 text-zinc-500'
                                        )}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Entry_ID</span>
                                    <div className="mt-2 font-mono text-xs text-zinc-600">{task.id}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 shrink-0 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-none border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase tracking-tighter"
                        >
                            ACKNOWLEDGE_&_CLOSE
                        </Button>
                    </div>
                </div>
            </Draggable>
        </div>,
        document.body
    );
}

/**
 * Memoized DraggableTaskPopup
 * Only re-renders when task ID, requirement text, status, or isOpen changes
 */
export const DraggableTaskPopup = memo(
    DraggableTaskPopupComponent,
    (prevProps, nextProps) => {
        // Early return if closed in both cases (no need to compare other props)
        if (!prevProps.isOpen && !nextProps.isOpen) return true;

        // Check if open state changed
        if (prevProps.isOpen !== nextProps.isOpen) return false;

        // Check task data changes
        if (prevProps.task.id !== nextProps.task.id) return false;
        if (prevProps.task.requirement_text !== nextProps.task.requirement_text) return false;
        if (prevProps.task.status !== nextProps.task.status) return false;
        if (prevProps.task.citation_quote !== nextProps.task.citation_quote) return false;
        if (prevProps.task.citation_source_id !== nextProps.task.citation_source_id) return false;
        if (prevProps.task.citation_page !== nextProps.task.citation_page) return false;

        // onClose is stable if parent uses useCallback
        return true;
    }
);
