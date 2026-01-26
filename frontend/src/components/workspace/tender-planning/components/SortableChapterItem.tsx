/**
 * SortableChapterItem Component
 *
 * A draggable, sortable chapter item containing sections and tasks.
 * Provides chapter-level operations and nested section management.
 */

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, MoreVertical, Trash2, Database, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GenerationBadge } from "./GenerationBadge";
import { SortableSectionItem } from "./SortableSectionItem";
import type { Chapter, TaskGenerationMode } from "../types";

interface SortableChapterItemProps {
    /** Chapter data */
    chapter: Chapter;
    /** Chapter index in outline */
    cIndex: number;
    /** Toggle chapter sections visibility */
    toggleChapter: (index: number) => void;
    /** Update chapter title */
    updateChapterTitle: (index: number, title: string) => void;
    /** Generate tasks for this chapter */
    handleGenerateTasks: (id: string, title: string, mode: TaskGenerationMode) => void;
    /** Whether AI generation is in progress */
    generating: boolean;
    /** Delete this chapter */
    deleteChapter: (index: number) => void;
    /** Toggle section tasks visibility */
    toggleSectionTasks: (cIndex: number, sIndex: number) => void;
    /** Update section title */
    updateSectionTitle: (cIndex: number, sIndex: number, title: string) => void;
    /** Delete a section */
    deleteSection: (cIndex: number, sIndex: number) => void;
    /** Trigger add section dialog */
    handleAddSectionClick: (chapterIndex: number) => void;
}

/**
 * Draggable chapter item with section management
 */
function SortableChapterItemComponent({
    chapter,
    cIndex,
    toggleChapter,
    updateChapterTitle,
    handleGenerateTasks,
    generating,
    deleteChapter,
    toggleSectionTasks,
    updateSectionTitle,
    deleteSection,
    handleAddSectionClick
}: SortableChapterItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: chapter.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group/chapter relative pl-4 border-l-2 border-black/10 dark:border-white/10 hover:border-[#FA4028] transition-colors"
        >
            {/* Chapter Row */}
            <div className="flex items-center gap-4 mb-4">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 opacity-100 text-black/20 dark:text-white/20 shrink-0" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-40 block">Chapter {cIndex + 1}</label>
                        <GenerationBadge
                            method={chapter.generation_method}
                            isModified={chapter.is_modified}
                        />
                    </div>
                    <Input
                        value={chapter.title}
                        onChange={(e) => updateChapterTitle(cIndex, e.target.value)}
                        className="font-bold text-lg rounded-none border-x-0 border-t-0 border-b-2 border-black/20 focus:border-[#FA4028] bg-transparent px-0 h-auto py-1 focus:ring-0"
                    />
                </div>
                <div className="flex items-center gap-1">
                    {/* Chapter Toggle Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleChapter(cIndex)}
                        className="h-6 w-6 rounded-none hover:bg-zinc-100 mt-4"
                        title={chapter.expanded ? "Hide Sections" : "Show Sections"}
                    >
                        {chapter.expanded ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold">{chapter.sections?.length || 0}</span>
                                <ChevronDown className="h-3 w-3" />
                            </div>
                        )}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-none data-[state=open]:bg-zinc-100 opacity-0 group-hover/chapter:opacity-100 transition-opacity mt-4"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-zinc-500">Chapter Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => handleGenerateTasks(chapter.id, chapter.title, 'function')}
                                disabled={generating}
                                className="focus:bg-blue-50 focus:text-blue-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <Database className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                FUNCTIONAL DESIGN (WF11)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleGenerateTasks(chapter.id, chapter.title, 'content')}
                                disabled={generating}
                                className="focus:bg-purple-50 focus:text-purple-600 cursor-pointer font-bold text-xs py-2"
                            >
                                <FileText className={cn("mr-2 h-3 w-3", generating && "animate-spin")} />
                                ARTICLE DESIGN (WF13)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => deleteChapter(cIndex)}
                                className="focus:bg-red-50 focus:text-red-500 cursor-pointer font-bold text-xs py-2"
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                DELETE CHAPTER
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Sections List */}
            {chapter.expanded && (
                <div className="pl-8 space-y-3">
                    <SortableContext
                        items={chapter.sections?.map(s => s.id) || []}
                        strategy={verticalListSortingStrategy}
                    >
                        {chapter.sections?.map((section, sIndex) => (
                            <SortableSectionItem
                                key={section.id || sIndex}
                                section={section}
                                chapterId={chapter.id}
                                chapterTitle={chapter.title}
                                cIndex={cIndex}
                                sIndex={sIndex}
                                toggleSectionTasks={toggleSectionTasks}
                                updateSectionTitle={updateSectionTitle}
                                deleteSection={deleteSection}
                                handleGenerateTasks={handleGenerateTasks}
                                generating={generating}
                            />
                        ))}
                    </SortableContext>

                    {/* Add Section Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddSectionClick(cIndex)}
                        className="h-8 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-[#FA4028] hover:bg-transparent pl-0 mt-2"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Section
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * Memoized SortableChapterItem to minimize re-renders
 * Only updates when chapter data, state, or indices change
 */
export const SortableChapterItem = memo(
    SortableChapterItemComponent,
    (prevProps, nextProps) => {
        const { chapter: prevChapter, cIndex: prevCIndex, generating: prevGenerating } = prevProps;
        const { chapter: nextChapter, cIndex: nextCIndex, generating: nextGenerating } = nextProps;

        // Check chapter identity and core properties
        if (prevChapter.id !== nextChapter.id) return false;
        if (prevChapter.title !== nextChapter.title) return false;
        if (prevChapter.expanded !== nextChapter.expanded) return false;
        if (prevChapter.generation_method !== nextChapter.generation_method) return false;
        if (prevChapter.is_modified !== nextChapter.is_modified) return false;

        // Check index
        if (prevCIndex !== nextCIndex) return false;

        // Check generating state
        if (prevGenerating !== nextGenerating) return false;

        // Check sections array reference (catches deep updates in immutable state)
        if (prevChapter.sections !== nextChapter.sections) return false;

        // Callbacks are assumed stable via useCallback
        return true;
    }
);
