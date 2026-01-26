/**
 * TenderPlanning Main Component
 *
 * Refactored from monolithic 1459-line component into modular architecture.
 * Manages proposal structure planning with drag-and-drop, AI generation, and CRUD operations.
 *
 * Architecture:
 * - State management via custom hooks
 * - Separated UI components
 * - Isolated business logic
 * - Maximum file size: < 200 lines
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Hooks
import {
    useTenderState,
    useTenderData,
    useTenderOperations,
    useDragDrop,
    useDialogState,
    useAIGeneration,
    useSaveOperations
} from "./hooks";

// Components
import {
    TenderHeader,
    TenderToolbar,
    ChapterList,
    TenderDialogs
} from "./components";

// Types
import type { TenderPlanningProps, GenerationMode, TaskGenerationMode } from "./types";

/**
 * Main TenderPlanning component - orchestrates all sub-modules
 */
export function TenderPlanning({ projectId, onNextStage, onPrevStage }: TenderPlanningProps) {
    // Initialize Supabase client
    const [supabase] = useState(() => createClient());

    // State Management
    const {
        outline,
        setOutline,
        deletedSectionIds,
        setDeletedSectionIds,
        loading,
        setLoading,
        saving,
        setSaving,
        generating,
        setGenerating,
        isHeaderExpanded,
        setIsHeaderExpanded,
    } = useTenderState();

    // Dialog State
    const {
        isMethodDialogOpen,
        setIsMethodDialogOpen,
        methodDialogContext,
        setMethodDialogContext,
        activeSectionChapterIndex,
        setActiveSectionChapterIndex,
        isTemplateDialogOpen,
        setIsTemplateDialogOpen,
        isGenerationModeDialogOpen,
        setIsGenerationModeDialogOpen,
        isTaskModeDialogOpen,
        setIsTaskModeDialogOpen,
        taskGenerationContext,
        setTaskGenerationContext,
        isSourceSelectionOpen,
        setIsSourceSelectionOpen,
        sourceSelectionContext,
        setSourceSelectionContext,
    } = useDialogState();

    // Data Operations
    const { fetchData } = useTenderData({
        projectId,
        supabase,
        setOutline,
        setLoading
    });

    // CRUD Operations
    const {
        toggleChapter,
        toggleSectionTasks,
        updateChapterTitle,
        updateSectionTitle,
        addChapter,
        deleteChapter,
        addSection,
        deleteSection,
    } = useTenderOperations({
        outline,
        setOutline,
        setDeletedSectionIds
    });

    // Drag & Drop
    const { handleDragEnd } = useDragDrop({ outline, setOutline });

    // Save Operations
    const { handleSave } = useSaveOperations({
        projectId,
        supabase,
        outline,
        deletedSectionIds,
        setDeletedSectionIds,
        setSaving
    });

    // AI Generation
    const {
        executeAIGeneration,
        executeSubsectionGeneration,
        executeTaskGeneration
    } = useAIGeneration({
        projectId,
        supabase,
        outline,
        setOutline,
        setGenerating,
        fetchData
    });

    // Load data on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Dialog Handlers
    const handleAddChapterClick = () => {
        setMethodDialogContext('chapter');
        setIsMethodDialogOpen(true);
    };

    const handleAddSectionClick = (chapterIndex: number) => {
        setActiveSectionChapterIndex(chapterIndex);
        setMethodDialogContext('section');
        setIsMethodDialogOpen(true);
    };

    const handleMethodSelect = async (method: 'manual' | 'ai' | 'template') => {
        setIsMethodDialogOpen(false);

        if (methodDialogContext === 'section' && activeSectionChapterIndex !== null) {
            if (method === 'ai') {
                const chapter = outline[activeSectionChapterIndex];
                if (!chapter) return;

                if (chapter.sections && chapter.sections.length > 0) {
                    setIsGenerationModeDialogOpen(true);
                    return;
                }

                setSourceSelectionContext({
                    type: 'section',
                    data: { chapterIndex: activeSectionChapterIndex, mode: 'append_only' },
                    next: (sourceIds) => executeSubsectionGeneration(activeSectionChapterIndex, 'append_only', sourceIds)
                });
                setIsSourceSelectionOpen(true);
            } else {
                addSection(activeSectionChapterIndex, method as 'manual' | 'ai_gen' | 'template');
                setActiveSectionChapterIndex(null);
            }
        } else {
            if (method === 'manual') {
                addChapter();
            } else if (method === 'template') {
                setIsTemplateDialogOpen(true);
            } else if (method === 'ai') {
                setIsGenerationModeDialogOpen(true);
            }
        }
    };

    const handleGenerationModeConfirm = async (mode: GenerationMode) => {
        setIsGenerationModeDialogOpen(false);

        if (methodDialogContext === 'chapter') {
            setSourceSelectionContext({
                type: 'chapter',
                data: { mode },
                next: (sourceIds) => executeAIGeneration(mode, sourceIds)
            });
            setIsSourceSelectionOpen(true);
        } else if (methodDialogContext === 'section' && activeSectionChapterIndex !== null) {
            setSourceSelectionContext({
                type: 'section',
                data: { chapterIndex: activeSectionChapterIndex, mode },
                next: (sourceIds) => executeSubsectionGeneration(activeSectionChapterIndex, mode, sourceIds)
            });
            setIsSourceSelectionOpen(true);
        }
    };

    const handleGenerateTasks = async (sectionId: string, sectionTitle: string, mode: TaskGenerationMode = 'function') => {
        const section = outline.flatMap(c => c.sections).find(s => s.id === sectionId);
        if (section && section.tasks && section.tasks.length > 0) {
            setTaskGenerationContext({ sectionId, sectionTitle, mode });
            setIsTaskModeDialogOpen(true);
            return;
        }

        setSourceSelectionContext({
            type: 'task',
            data: { sectionId, sectionTitle, mode },
            next: (sourceIds) => executeTaskGeneration(sectionId, sectionTitle, mode, 'append_only', sourceIds)
        });
        setIsSourceSelectionOpen(true);
    };

    const handleTaskModeConfirm = async (conflictMode: GenerationMode) => {
        if (!taskGenerationContext) return;
        setIsTaskModeDialogOpen(false);
        const { sectionId, sectionTitle, mode } = taskGenerationContext;

        setSourceSelectionContext({
            type: 'task',
            data: { sectionId, sectionTitle, mode, conflictMode },
            next: (sourceIds) => executeTaskGeneration(sectionId, sectionTitle, mode, conflictMode, sourceIds)
        });
        setIsSourceSelectionOpen(true);
        setTaskGenerationContext(null);
    };

    const handleSourceSelectionConfirm = (sourceIds: string[]) => {
        if (sourceSelectionContext) {
            sourceSelectionContext.next(sourceIds);
            setSourceSelectionContext(null);
        }
    };

    return (
        <div className="h-full w-full">
            <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
                <div className="flex-1">
                    {/* Header */}
                    <TenderHeader
                        isExpanded={isHeaderExpanded}
                        onToggleExpanded={() => setIsHeaderExpanded(!isHeaderExpanded)}
                        onPrevStage={onPrevStage}
                        onNextStage={onNextStage}
                    />

                    {/* Toolbar */}
                    <TenderToolbar saving={saving} onSave={handleSave} />

                    {/* Chapter List */}
                    <ChapterList
                        outline={outline}
                        onDragEnd={handleDragEnd}
                        generating={generating}
                        toggleChapter={toggleChapter}
                        updateChapterTitle={updateChapterTitle}
                        handleGenerateTasks={handleGenerateTasks}
                        deleteChapter={deleteChapter}
                        toggleSectionTasks={toggleSectionTasks}
                        updateSectionTitle={updateSectionTitle}
                        deleteSection={deleteSection}
                        handleAddSectionClick={handleAddSectionClick}
                        handleAddChapterClick={handleAddChapterClick}
                    />
                </div>
            </div>

            {/* Dialogs */}
            <TenderDialogs
                projectId={projectId}
                isMethodDialogOpen={isMethodDialogOpen}
                methodDialogContext={methodDialogContext}
                onMethodDialogChange={setIsMethodDialogOpen}
                onMethodSelect={handleMethodSelect}
                isGenerationModeDialogOpen={isGenerationModeDialogOpen}
                onGenerationModeDialogChange={setIsGenerationModeDialogOpen}
                onGenerationModeConfirm={handleGenerationModeConfirm}
                isTemplateDialogOpen={isTemplateDialogOpen}
                onTemplateDialogClose={() => setIsTemplateDialogOpen(false)}
                onTemplateSuccess={fetchData}
                isTaskModeDialogOpen={isTaskModeDialogOpen}
                onTaskModeDialogChange={setIsTaskModeDialogOpen}
                onTaskModeConfirm={handleTaskModeConfirm}
                isSourceSelectionOpen={isSourceSelectionOpen}
                onSourceSelectionChange={setIsSourceSelectionOpen}
                onSourceSelectionConfirm={handleSourceSelectionConfirm}
            />
        </div>
    );
}
