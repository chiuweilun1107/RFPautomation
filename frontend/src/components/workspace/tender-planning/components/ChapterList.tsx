/**
 * ChapterList Component
 *
 * Main content area displaying the drag-and-drop chapter outline.
 * Wraps chapters in DnD context and provides add chapter functionality.
 */

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SortableChapterItem } from "./SortableChapterItem";
import type { Chapter, TaskGenerationMode } from "../types";

interface ChapterListProps {
    /** Chapter outline data */
    outline: Chapter[];
    /** Drag end handler */
    onDragEnd: (event: DragEndEvent) => void;
    /** Whether AI generation is in progress */
    generating: boolean;
    /** Toggle chapter sections visibility */
    toggleChapter: (index: number) => void;
    /** Update chapter title */
    updateChapterTitle: (index: number, title: string) => void;
    /** Generate tasks for a chapter/section */
    handleGenerateTasks: (id: string, title: string, mode: TaskGenerationMode) => void;
    /** Delete a chapter */
    deleteChapter: (index: number) => void;
    /** Toggle section tasks visibility */
    toggleSectionTasks: (cIndex: number, sIndex: number) => void;
    /** Update section title */
    updateSectionTitle: (cIndex: number, sIndex: number, title: string) => void;
    /** Delete a section */
    deleteSection: (cIndex: number, sIndex: number) => void;
    /** Trigger add section dialog */
    handleAddSectionClick: (chapterIndex: number) => void;
    /** Trigger add chapter dialog */
    handleAddChapterClick: () => void;
}

/**
 * Draggable chapter list with add chapter functionality
 */
export function ChapterList({
    outline,
    onDragEnd,
    generating,
    toggleChapter,
    updateChapterTitle,
    handleGenerateTasks,
    deleteChapter,
    toggleSectionTasks,
    updateSectionTitle,
    deleteSection,
    handleAddSectionClick,
    handleAddChapterClick
}: ChapterListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Card className="rounded-none border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                <CardHeader className="border-b border-black dark:border-white bg-black/5 dark:bg-white/5 py-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <GripVertical className="h-5 w-5 opacity-40" />
                        SERVICE_PROPOSAL_OUTLINE
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={outline.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {outline.map((chapter, cIndex) => (
                                <SortableChapterItem
                                    key={chapter.id || cIndex}
                                    chapter={chapter}
                                    cIndex={cIndex}
                                    toggleChapter={toggleChapter}
                                    updateChapterTitle={updateChapterTitle}
                                    handleGenerateTasks={handleGenerateTasks}
                                    generating={generating}
                                    deleteChapter={deleteChapter}
                                    toggleSectionTasks={toggleSectionTasks}
                                    updateSectionTitle={updateSectionTitle}
                                    deleteSection={deleteSection}
                                    handleAddSectionClick={handleAddSectionClick}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {/* Add Chapter Button */}
                    <Button
                        variant="outline"
                        onClick={handleAddChapterClick}
                        disabled={generating}
                        className="w-full py-6 border-dashed border-2 border-black/20 hover:border-[#FA4028] hover:bg-[#FA4028] hover:text-white rounded-none uppercase tracking-widest font-bold"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                GENERATING_STRUCTURE...
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2" />
                                ADD_NEW_CHAPTER
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
