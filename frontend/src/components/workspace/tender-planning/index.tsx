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
    useSaveOperations,
    useContentGeneration,
    useTemplatePreview
} from "./hooks";

// Components
import {
    TenderHeader,
    TenderToolbar,
    ChapterList,
    TenderDialogs,
    TemplatePreviewDialog
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

    // Task Filter State
    const [taskFilter, setTaskFilter] = useState<'all' | 'wf11_functional' | 'wf13_article'>('all');

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
        isTaskGenerationDialogOpen,
        setIsTaskGenerationDialogOpen,
        taskGenerationTypeContext,
        setTaskGenerationTypeContext,
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
        executeTaskGeneration,
        executeTaskGenerationWithType
    } = useAIGeneration({
        projectId,
        supabase,
        outline,
        setOutline,
        setGenerating,
        fetchData
    });

    // Content Generation (WF12)
    const {
        executeContentGeneration,
        executeSectionContentGeneration,
    } = useContentGeneration({
        projectId,
        supabase,
        outline,
        setGenerating,
        fetchData
    });

    // Template Preview
    const {
        templates,
        selectedTemplateId,
        setSelectedTemplateId,
        previewing,
        previewContent,
        previewDialogOpen,
        setPreviewDialogOpen,
        templateName,
        handlePreview
    } = useTemplatePreview(projectId);

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
            next: (sourceIds) => {
                // After source selection, show TaskGenerationDialog for project type selection
                setTaskGenerationTypeContext({
                    sectionId,
                    sectionTitle,
                    mode,
                    conflictMode: 'append_only',
                    sourceIds
                });
                setIsTaskGenerationDialogOpen(true);
            }
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
            next: (sourceIds) => {
                // Check if we should skip the dialog (WF13 + Overwrite)
                if (mode === 'content' && conflictMode === 'replace_all') {
                    executeTaskGenerationWithType(
                        sectionId,
                        sectionTitle,
                        mode,
                        conflictMode,
                        sourceIds,
                        undefined, // Default project type
                        "" // Default description
                    );
                    return;
                }

                // After source selection, show TaskGenerationDialog for project type selection
                setTaskGenerationTypeContext({
                    sectionId,
                    sectionTitle,
                    mode,
                    conflictMode,
                    sourceIds
                });
                setIsTaskGenerationDialogOpen(true);
            }
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

    const handleTaskGenerationConfirm = async (options: any) => {
        if (!taskGenerationTypeContext) return;

        const { sectionId, sectionTitle, mode, conflictMode, sourceIds } = taskGenerationTypeContext;

        // Call executeTaskGeneration with projectType and userDescription
        await executeTaskGenerationWithType(
            sectionId,
            sectionTitle,
            mode,
            conflictMode,
            sourceIds,
            options.projectType, // Pass user-selected project type (or undefined for AI auto-detect)
            options.userDescription // Pass user description for additional context
        );

        // Close dialog and clear context
        setIsTaskGenerationDialogOpen(false);
        setTaskGenerationTypeContext(null);
    };

    const handleGenerateContent = (task: any, section: any) => {
        setSourceSelectionContext({
            type: 'task',
            data: {
                taskId: task.id,
                taskText: typeof task.requirement_text === 'string' ? task.requirement_text : JSON.stringify(task.requirement_text),
                sectionId: section.id,
                sectionTitle: section.title,
                mode: 'content_single'
            },
            next: (sourceIds) => executeContentGeneration(
                task.id,
                typeof task.requirement_text === 'string' ? task.requirement_text : JSON.stringify(task.requirement_text),
                section.id,
                section.title,
                sourceIds
            )
        });
        setIsSourceSelectionOpen(true);
    };

    const handleGenerateSectionContent = (section: any) => {
        if (!section.tasks || section.tasks.length === 0) {
            return;
        }
        setSourceSelectionContext({
            type: 'section',
            data: {
                sectionId: section.id,
                sectionTitle: section.title,
                tasks: section.tasks,
                mode: 'content_batch'
            },
            next: (sourceIds) => executeSectionContentGeneration(
                section.id,
                section.title,
                section.tasks,
                sourceIds
            )
        });
        setIsSourceSelectionOpen(true);
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
                    <TenderToolbar
                        saving={saving}
                        onSave={handleSave}
                        selectedTemplateId={selectedTemplateId}
                        templates={templates}
                        onTemplateSelect={setSelectedTemplateId}
                        onPreview={handlePreview}
                        previewing={previewing}
                    />

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
                        taskFilter={taskFilter} // Pass filter state
                        setTaskFilter={setTaskFilter} // Pass filter setter
                        handleGenerateContent={handleGenerateContent}
                        handleGenerateSectionContent={handleGenerateSectionContent}
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
                isTaskGenerationDialogOpen={isTaskGenerationDialogOpen}
                onTaskGenerationDialogChange={setIsTaskGenerationDialogOpen}
                taskGenerationSectionTitle={taskGenerationTypeContext?.sectionTitle || ''}
                onTaskGenerationConfirm={handleTaskGenerationConfirm}
            />

            {/* Template Preview Dialog */}
            <TemplatePreviewDialog
                open={previewDialogOpen}
                onOpenChange={setPreviewDialogOpen}
                previewContent={previewContent}
                templateName={templateName}
            />
        </div>
    );
}
