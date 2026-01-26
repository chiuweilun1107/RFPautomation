/**
 * DraggableTaskPopup Component
 *
 * Full-screen draggable modal displaying detailed task information.
 * Features copy-to-clipboard and download functionality for task requirements.
 */

import * as React from "react";
import { memo } from "react";
import { GripVertical, Plus, Copy, Check, Download, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, Section } from "../types";
import { CitationBadge, Evidence } from "@/components/workspace/CitationBadge";
import { SourceDetailPanel } from "@/components/workspace/SourceDetailPanel";
import { collectTaskCitations } from "../utils/citationUtils";
import { appendSourceToRequirement } from "../utils/requirementSourceFormatter";

interface DraggableTaskPopupProps {
    /** Task data to display */
    task: Task;
    /** Parent section */
    section: Section;
    /** Whether the popup is visible */
    isOpen: boolean;
    /** Callback to close the popup */
    onClose: () => void;
    /** Content generation handler */
    handleGenerateContent: (task: any, section: any) => void;
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
function DraggableTaskPopupComponent({ task, section, isOpen, onClose, handleGenerateContent }: DraggableTaskPopupProps) {
    const nodeRef = React.useRef(null);
    const [copied, setCopied] = React.useState(false);
    const supabase = createClient();

    // Citation states
    const [selectedEvidence, setSelectedEvidence] = React.useState<Evidence | null>(null);
    const [evidences, setEvidences] = React.useState<Record<number, Evidence>>({});
    const [citationIds, setCitationIds] = React.useState<number[]>([]);

    // Citation Window State (Draggable)
    const [selectedSource, setSelectedSource] = React.useState<any | null>(null);
    const [citationPosition, setCitationPosition] = React.useState({ x: 60, y: 170 }); // Slightly offset from default task popup
    const [isCitationDragging, setIsCitationDragging] = React.useState(false);
    const [citationDragOffset, setCitationDragOffset] = React.useState({ x: 0, y: 0 });

    // Content state
    const [content, setContent] = React.useState<string | null>(null);
    const [loadingContent, setLoadingContent] = React.useState(false);

    // Fetch content callback
    const fetchContent = React.useCallback(async () => {
        if (!task?.id) return;
        setLoadingContent(true);
        try {
            const { data, error } = await supabase
                .from('task_contents')
                .select('content')
                .eq('task_id', task.id)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore no rows found
                console.error('Error fetching content:', error);
            }

            setContent(data?.content || null);
        } catch (err) {
            console.error('Fetch content error:', err);
        } finally {
            setLoadingContent(false);
        }
    }, [task?.id]); // Removing supabase from deps as stable

    // Effect: Collect citations
    React.useEffect(() => {
        if (task) {
            // Force citations to be an array and cast to any to bypass strict type check against global Task type
            const { evidences, citationIds } = collectTaskCitations({ ...task, citations: task.citations || [] } as any);
            setEvidences(evidences);
            setCitationIds(citationIds);
        }
    }, [task.id, task.citations]);

    // Effect: Handle Citation Window Dragging
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isCitationDragging) return;

            // Define window constraints
            const dialogWidth = 580;
            const handleHeight = 24;

            let newX = e.clientX - citationDragOffset.x;
            let newY = e.clientY - citationDragOffset.y;

            // Clamp X position
            newX = Math.max(0, Math.min(newX, window.innerWidth - dialogWidth));

            // Clamp Y position
            newY = Math.max(0, Math.min(newY, window.innerHeight - handleHeight));

            setCitationPosition({
                x: newX,
                y: newY
            });
        };

        const handleMouseUp = () => {
            setIsCitationDragging(false);
        };

        if (isCitationDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isCitationDragging, citationDragOffset]);

    // Handle Citation Click with Source Fetching
    const handleCitationClick = async (evidence: Evidence) => {
        setSelectedEvidence(evidence);
        setCitationPosition({ x: 60, y: 170 }); // Reset position or keep offset

        try {
            const { data: sourceData, error: sourceError } = await supabase
                .from('sources')
                .select('*')
                .eq('id', evidence.source_id)
                .maybeSingle();

            if (sourceError) {
                console.error("[TaskPopup] Error fetching source:", sourceError);
                setSelectedSource(null);
            } else {
                setSelectedSource(sourceData);
            }
        } catch (err) {
            console.error("[TaskPopup] Catch error fetching source:", err);
            setSelectedSource(null);
        }
    };

    // Handle Citation Drag Start
    const handleCitationMouseDown = (e: React.MouseEvent) => {
        setIsCitationDragging(true);
        setCitationDragOffset({
            x: e.clientX - citationPosition.x,
            y: e.clientY - citationPosition.y
        });
    };

    // Effect: Fetch content and subscribe
    React.useEffect(() => {
        if (isOpen && task?.id) {
            fetchContent();

            // Subscribe to realtime updates for this task's content
            const channel = supabase
                .channel(`task-content-${task.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'task_contents',
                        filter: `task_id=eq.${task.id}`
                    },
                    (payload: any) => {
                        setContent((payload.new as any).content);
                        toast.success("New content received!");
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, task?.id, fetchContent]);

    // Hook Rule: Early returns must happen AFTER hooks
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
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
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
                                onClick={() => handleGenerateContent(task, section)}
                                className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5 text-white/90 hover:text-white"
                                title="Generate Content with AI"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">GENERATE</span>
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
                                    {appendSourceToRequirement(
                                        renderRequirementText(task.requirement_text),
                                        task.citations || []
                                    )}
                                </div>
                            </div>

                            {/* Generated Content Section */}
                            {(content || loadingContent) && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-orange-500" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Generated_Content</h4>
                                    </div>
                                    <div className="p-5 bg-orange-50/50 dark:bg-orange-950/10 border-2 border-orange-200 dark:border-orange-900 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                        {loadingContent ? (
                                            <div className="flex items-center justify-center h-full gap-2 text-orange-600/50">
                                                <Sparkles className="w-4 h-4 animate-spin" />
                                                <span className="text-xs font-bold uppercase">Loading_Content...</span>
                                            </div>
                                        ) : (
                                            content || <span className="text-zinc-400 italic">Content generation pending...</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Source References - Digital Badge Display */}
                            {citationIds.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-blue-500" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Source_References</h4>
                                    </div>
                                    <div className="border-2 border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-5">
                                        {/* Display quote from first citation if available */}
                                        {evidences[citationIds[0]]?.quote && (
                                            <blockquote className="text-xs italic text-zinc-600 dark:text-zinc-400 border-l-4 border-[#FA4028] pl-4 py-1 mb-4">
                                                "{evidences[citationIds[0]].quote}"
                                            </blockquote>
                                        )}
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">
                                                Citations:
                                            </span>
                                            {citationIds.map((citId) => (
                                                <CitationBadge
                                                    key={citId}
                                                    evidence={evidences[citId]}
                                                    onClick={(evidence) => handleCitationClick(evidence)}
                                                />
                                            ))}
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

            {/* Citation Detail Panel - Draggable Portal */}
            {selectedEvidence && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: `${citationPosition.x}px`,
                        top: `${citationPosition.y}px`,
                        transition: isCitationDragging ? 'none' : 'all 0.2s ease-out'
                    }}
                >
                    <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-[580px] h-[80vh] flex flex-col shadow-xl">
                        <div
                            className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white shrink-0"
                            onMouseDown={handleCitationMouseDown}
                        >
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <SourceDetailPanel
                                evidence={selectedEvidence}
                                source={selectedSource}
                                onClose={() => {
                                    setSelectedEvidence(null);
                                    setSelectedSource(null);
                                }}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
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

        // Check citations array
        if (JSON.stringify(prevProps.task.citations) !== JSON.stringify(nextProps.task.citations)) {
            return false;
        }

        // onClose is stable if parent uses useCallback
        return true;
    }
);
