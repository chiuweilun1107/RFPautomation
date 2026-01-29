/**
 * DraggableTaskPopup Component
 *
 * Full-screen draggable modal displaying detailed task information.
 * Features copy-to-clipboard and download functionality for task requirements.
 *
 * Refactored to use:
 * - useDraggableDialog hook for citation panel dragging
 * - useTaskPopupState hook for task popup state management
 */

import * as React from "react";
import { memo, useRef } from "react";
import { GripVertical, Plus, Copy, Check, Download, Sparkles, Image as ImageIcon } from "lucide-react";
import { createPortal } from "react-dom";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDraggableDialog } from "@/hooks";
import type { Task, Section } from "../types";
import { CitationBadge } from "@/components/workspace/CitationBadge";
import { MarkdownWithCitations } from "@/components/workspace/MarkdownWithCitations";
import { SourceDetailPanel } from "@/components/workspace/SourceDetailPanel";
import { useTaskPopupState } from "../hooks";

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
    /** Initial content if prefetched */
    initialContent?: string | null;
    /** Image generation handler */
    handleGenerateImage: (task: Task) => void;
}

/**
 * Citation Panel Component - Extracted for clarity
 */
interface CitationPanelProps {
    selectedEvidence: NonNullable<ReturnType<typeof useTaskPopupState>['selectedEvidence']>;
    selectedSource: any | null;
    onClose: () => void;
    dialogStyle: React.CSSProperties;
    handleMouseDown: (e: React.MouseEvent) => void;
}

const CitationPanel = memo(function CitationPanel({
    selectedEvidence,
    selectedSource,
    onClose,
    dialogStyle,
    handleMouseDown,
}: CitationPanelProps) {
    return createPortal(
        <div
            className="fixed z-[9999] pointer-events-none"
            style={dialogStyle}
        >
            <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-[580px] h-[80vh] flex flex-col shadow-xl">
                <div
                    className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white shrink-0"
                    onMouseDown={handleMouseDown}
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
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
});

/**
 * Task Header Component - Action buttons and drag handle
 */
interface TaskHeaderProps {
    copied: boolean;
    onCopy: () => void;
    onDownload: () => void;
    onGenerateContent: () => void;
    onGenerateImage: () => void;
    onClose: () => void;
}

const TaskHeader = memo(function TaskHeader({
    copied,
    onCopy,
    onDownload,
    onGenerateContent,
    onGenerateImage,
    onClose,
}: TaskHeaderProps) {
    return (
        <div className="drag-handle cursor-move p-4 border-b-2 border-black dark:border-white bg-[#FA4028] text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 opacity-50" />
                <h3 className="text-sm font-black uppercase tracking-widest font-mono italic">Task_Details_View</h3>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onCopy}
                    className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5"
                    title="Copy Requirements"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase">Copy</span>
                </button>
                <button
                    onClick={onDownload}
                    className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5"
                    title="Download Requirements"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">Download</span>
                </button>
                <button
                    onClick={onGenerateContent}
                    className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5 text-white/90 hover:text-white"
                    title="Generate Content with AI"
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">GENERATE</span>
                </button>
                <button
                    onClick={onGenerateImage}
                    className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50 flex items-center gap-1.5 text-white/90 hover:text-white"
                    title="Generate Visual Image"
                >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase">IMAGE</span>
                </button>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-black/20 transition-colors border-2 border-transparent hover:border-black/50"
                >
                    <Plus className="w-5 h-5 rotate-45" />
                </button>
            </div>
        </div>
    );
});

/**
 * Task Images Section Component
 */
interface TaskImagesSectionProps {
    images: NonNullable<Task['task_images']>;
}

const TaskImagesSection = memo(function TaskImagesSection({ images }: TaskImagesSectionProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Generated_Visuals</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="group relative border-2 border-black dark:border-white">
                        <div className="aspect-video bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                            <img
                                src={img.image_url}
                                alt={img.caption || "Generated task image"}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                        </div>
                        <div className="p-3 bg-white dark:bg-zinc-950 border-t-2 border-black dark:border-white">
                            <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-1.5 py-0.5 border border-purple-200">
                                    {img.image_type}
                                </span>
                                <button
                                    onClick={() => window.open(img.image_url, '_blank')}
                                    className="text-[9px] font-bold uppercase hover:underline"
                                >
                                    View Full
                                </button>
                            </div>
                            {img.caption && (
                                <p className="text-[11px] leading-tight text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                    {img.caption}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

/**
 * Brutalist-styled draggable task detail popup
 */
function DraggableTaskPopupComponent({
    task,
    section,
    isOpen,
    onClose,
    handleGenerateContent,
    initialContent,
    handleGenerateImage
}: DraggableTaskPopupProps) {
    const nodeRef = useRef(null);

    // Use custom hooks for state management
    const {
        copied,
        handleCopy,
        handleDownload,
        selectedEvidence,
        evidences,
        convertedText,
        selectedSource,
        content,
        loadingContent,
        handleCitationClick,
        closeCitationPanel,
    } = useTaskPopupState({
        task,
        isOpen,
        initialContent,
    });

    // Use draggable dialog hook for citation panel
    const {
        handleMouseDown: handleCitationMouseDown,
        dialogStyle: citationDialogStyle,
        resetPosition: resetCitationPosition,
    } = useDraggableDialog({
        initialPosition: { x: 60, y: 170 },
        dialogWidth: 580,
        handleHeight: 24,
    });

    // Handle citation click with position reset
    const onCitationClick = React.useCallback(
        async (evidence: typeof selectedEvidence) => {
            if (!evidence) return;
            resetCitationPosition();
            await handleCitationClick(evidence);
        },
        [handleCitationClick, resetCitationPosition]
    );

    // Early return after hooks
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
            <Draggable nodeRef={nodeRef} handle=".drag-handle">
                <div
                    ref={nodeRef}
                    className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] flex flex-col max-h-[85vh] overflow-hidden"
                >
                    {/* Header / Drag Handle */}
                    <TaskHeader
                        copied={copied}
                        onCopy={handleCopy}
                        onDownload={handleDownload}
                        onGenerateContent={() => handleGenerateContent(task, section)}
                        onGenerateImage={() => handleGenerateImage(task)}
                        onClose={onClose}
                    />

                    <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-zinc-950">
                        <div className="p-8 space-y-8">
                            {/* Requirement Spec */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-black dark:bg-white" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Requirement_Spec</h4>
                                </div>
                                <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 font-mono text-sm leading-relaxed">
                                    <MarkdownWithCitations
                                        text={convertedText}
                                        evidences={evidences}
                                        onCitationClick={onCitationClick}
                                    />
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
                            {Object.keys(evidences).length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-blue-500" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Source_References</h4>
                                    </div>
                                    <div className="border-2 border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-5">
                                        {/* Display quote from first citation if available */}
                                        {evidences[1]?.quote && (
                                            <blockquote className="text-xs italic text-zinc-600 dark:text-zinc-400 border-l-4 border-[#FA4028] pl-4 py-1 mb-4">
                                                "{evidences[1].quote}"
                                            </blockquote>
                                        )}
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-2">
                                                All_Citations:
                                            </span>
                                            {Object.values(evidences).map((evidence) => (
                                                <CitationBadge
                                                    key={evidence.id}
                                                    evidence={evidence}
                                                    onClick={onCitationClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Task Images Section */}
                            {task.task_images && task.task_images.length > 0 && (
                                <TaskImagesSection images={task.task_images} />
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
            {selectedEvidence && (
                <CitationPanel
                    selectedEvidence={selectedEvidence}
                    selectedSource={selectedSource}
                    onClose={closeCitationPanel}
                    dialogStyle={citationDialogStyle}
                    handleMouseDown={handleCitationMouseDown}
                />
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
