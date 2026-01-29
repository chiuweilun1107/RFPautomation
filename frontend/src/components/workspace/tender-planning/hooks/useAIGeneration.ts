/**
 * useAIGeneration Hook
 *
 * Handles all AI generation workflows:
 * - Chapter/section structure generation
 * - Sub-section generation
 * - Task generation (function & content modes)
 */

import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors';
import type { Chapter, GenerationMode, TaskGenerationMode } from '../types';

interface UseAIGenerationProps {
    projectId: string;
    supabase: SupabaseClient;
    outline: Chapter[];
    setOutline: React.Dispatch<React.SetStateAction<Chapter[]>>;
    setGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    fetchData: () => Promise<void>;
}

interface UseAIGenerationReturn {
    executeAIGeneration: (mode: GenerationMode, sourceIds: string[]) => Promise<void>;
    executeSubsectionGeneration: (chapterIndex: number, mode: GenerationMode, sourceIds: string[]) => Promise<void>;
    executeTaskGeneration: (sectionId: string, sectionTitle: string, mode: TaskGenerationMode, conflictMode: GenerationMode, sourceIds: string[]) => Promise<void>;
    executeTaskGenerationWithType: (sectionId: string, sectionTitle: string, mode: TaskGenerationMode, conflictMode: GenerationMode, sourceIds: string[], projectType?: string, userDescription?: string) => Promise<void>;
}

/**
 * AI generation operations for chapters, sections, and tasks
 */
export function useAIGeneration({
    projectId,
    supabase,
    outline,
    setOutline,
    setGenerating,
    fetchData
}: UseAIGenerationProps): UseAIGenerationReturn {
    const { handleApiError, handleDbError } = useErrorHandler();

    // Execute structure generation (WF04)
    const executeAIGeneration = useCallback(async (mode: GenerationMode, sourceIds: string[]) => {
        setGenerating(true);
        logger.info('Starting AI Generation', 'TenderPlanning:WF04', { mode, projectId });
        try {
            if (mode === 'replace_all') {
                // 1. Delete all tasks first (to avoid FK constraints if no CASCADE)
                const { error: deleteTasksError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('project_id', projectId);
                if (deleteTasksError) {
                    console.error('Error deleting tasks:', deleteTasksError);
                    // Don't throw here, try to clean sections anyway. 
                    // If sections fail due to FK, it will be caught below.
                }

                // 2. Delete all sections
                const { error: deleteSectionsError } = await supabase
                    .from('sections')
                    .delete()
                    .eq('project_id', projectId);
                if (deleteSectionsError) throw deleteSectionsError;

                setOutline([]);
            }

            const res = await fetch('/api/webhook/generate-structure-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sourceIds,
                    action: 'append',
                    generation_method: 'ai_gen'
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to trigger AI generation");
            }

            toast.success("Structure Generation Started", { description: "AI is creating chapters..." });

            setTimeout(() => {
                fetchData();
                setGenerating(false);
                toast.success("Structure Updated");
            }, 5000);
        } catch (error) {
            handleApiError(error, 'TenderPlanning:WF04', {
                userMessage: 'Failed to generate structure. Please try again.',
                metadata: { mode, projectId, sourceCount: sourceIds.length },
            });
            setGenerating(false);
        }
    }, [projectId, supabase, setOutline, setGenerating, fetchData, handleApiError, handleDbError]);

    // Execute sub-section generation (WF10)
    const executeSubsectionGeneration = useCallback(async (chapterIndex: number, mode: GenerationMode, sourceIds: string[]) => {
        setGenerating(true);
        const chapter = outline[chapterIndex];
        if (!chapter) {
            setGenerating(false);
            return;
        }

        logger.info('Triggering WF10 (Sub-section Gen)', 'TenderPlanning:WF10', {
            chapter: chapter.title,
            mode,
            projectId,
        });

        try {
            if (mode === 'replace_all' && chapter.id) {
                const { error: deleteError } = await supabase
                    .from('sections')
                    .delete()
                    .eq('parent_id', chapter.id);
                if (deleteError) throw deleteError;
            }

            const { data: initialSections } = await supabase
                .from('sections')
                .select('id')
                .eq('project_id', projectId);
            const initialIds = new Set((initialSections || []).map(s => s.id));

            const allParentSections = outline.map(c => c.title);
            const payload = {
                id: chapter.id,
                projectId,
                project_id: projectId,
                sectionId: chapter.id,
                sectionTitle: chapter.title,
                allParentSections,
                chapterId: chapter.id,
                chapter_id: chapter.id,
                parentId: chapter.id,
                parent_id: chapter.id,
                chapterTitle: chapter.title,
                chapter_title: chapter.title,
                sourceIds,
                generation_method: 'ai_gen'
            };

            const res = await fetch('/api/webhook/generate-requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate sections");
            }

            toast.success("AI Generation Started", {
                description: "AI Workflow is generating sub-sections..."
            });

            setTimeout(async () => {
                const { data: finalSections } = await supabase
                    .from('sections')
                    .select('id, generation_method, is_modified')
                    .eq('project_id', projectId);

                if (finalSections) {
                    const newIds = finalSections
                        .filter(s => !initialIds.has(s.id))
                        .map(s => s.id);

                    if (newIds.length > 0) {
                        await supabase
                            .from('sections')
                            .update({ generation_method: 'ai_gen' })
                            .in('id', newIds);
                    }
                }

                fetchData();
                setGenerating(false);
                toast.success("Structure Updated");
            }, 4000);
        } catch (error) {
            handleApiError(error, 'TenderPlanning:WF10', {
                userMessage: 'Failed to generate sub-sections. Please try again.',
                metadata: {
                    chapterTitle: chapter.title,
                    mode,
                    projectId,
                },
            });
            setGenerating(false);
        }
    }, [projectId, supabase, outline, setGenerating, fetchData, handleApiError, handleDbError]);

    // Execute task generation (WF11 or WF13)
    const executeTaskGeneration = useCallback(async (
        sectionId: string,
        sectionTitle: string,
        mode: TaskGenerationMode,
        conflictMode: GenerationMode,
        sourceIds: string[]
    ) => {
        setGenerating(true);
        logger.info('Generating tasks', `TenderPlanning:${mode === 'function' ? 'WF11' : 'WF13'}`, {
            sectionTitle,
            sectionId,
            mode,
            conflictMode,
            projectId,
        });
        try {
            if (conflictMode === 'replace_all') {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('section_id', sectionId);
                if (deleteError) throw deleteError;
            }

            if (sourceIds.length === 0) {
                toast.error("No sources selected", { description: "Please select at least one source." });
                setGenerating(false);
                return;
            }

            const allSections = outline.map(c => c.title);
            const endpoint = mode === 'function' ? '/api/webhook/generate-tasks-advanced' : '/api/webhook/generate-tasks-management';

            logger.debug('Posting to task generation endpoint', 'TenderPlanning', {
                endpoint,
                sourceCount: sourceIds.length,
            });
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId,
                    sectionTitle,
                    sourceIds,
                    allSections
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to trigger task generation");
            }

            toast.success("Task Generation Started", {
                description: mode === 'function'
                    ? `AI is designing function specs (WF11) using ${sourceIds.length} sources...`
                    : `AI is designing content draft (WF13) using ${sourceIds.length} sources...`
            });

            setTimeout(() => {
                fetchData();
                setGenerating(false);
                toast.success("Tasks Updated", { description: "New tasks have been added to the section." });
            }, 5000);
        } catch (error) {
            handleApiError(error, `TenderPlanning:${mode === 'function' ? 'WF11' : 'WF13'}`, {
                userMessage: 'Failed to generate tasks. Please try again.',
                metadata: {
                    sectionTitle,
                    mode,
                    conflictMode,
                    projectId,
                },
            });
            setGenerating(false);
        }
    }, [projectId, supabase, outline, setGenerating, fetchData, handleApiError, handleDbError]);

    // Execute task generation with project type (WF11 with Smart Router)
    const executeTaskGenerationWithType = useCallback(async (
        sectionId: string,
        sectionTitle: string,
        mode: TaskGenerationMode,
        conflictMode: GenerationMode,
        sourceIds: string[],
        projectType?: string,
        userDescription?: string
    ) => {
        setGenerating(true);
        logger.info('Generating tasks with type', `TenderPlanning:${mode === 'function' ? 'WF11' : 'WF13'}`, {
            sectionTitle,
            sectionId,
            mode,
            conflictMode,
            projectType,
            projectId,
        });
        try {
            if (conflictMode === 'replace_all') {
                const { error: deleteError } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('section_id', sectionId);
                if (deleteError) throw deleteError;
            }

            if (sourceIds.length === 0) {
                toast.error("No sources selected", { description: "Please select at least one source." });
                setGenerating(false);
                return;
            }

            const allSections = outline.map(c => c.title);
            const endpoint = mode === 'function' ? '/api/webhook/generate-tasks-advanced' : '/api/webhook/generate-tasks-management';

            logger.debug('Posting to task generation endpoint', 'TenderPlanning', {
                endpoint,
                sourceCount: sourceIds.length,
                projectType: projectType || 'auto-detect'
            });
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sectionId,
                    sectionTitle,
                    sourceIds,
                    allSections,
                    projectType, // Pass user-selected project type (or undefined for AI auto-detect)
                    userDescription // Pass user description for additional context
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to trigger task generation");
            }

            toast.success("Task Generation Started", {
                description: mode === 'function'
                    ? `AI is designing function specs (WF11) using ${sourceIds.length} sources...`
                    : `AI is designing content draft (WF13) using ${sourceIds.length} sources...`
            });

            setTimeout(() => {
                fetchData();
                setGenerating(false);
                toast.success("Tasks Updated", { description: "New tasks have been added to the section." });
            }, 5000);
        } catch (error) {
            handleApiError(error, `TenderPlanning:${mode === 'function' ? 'WF11' : 'WF13'}`, {
                userMessage: 'Failed to generate tasks. Please try again.',
                metadata: {
                    sectionTitle,
                    mode,
                    conflictMode,
                    projectType,
                    projectId,
                },
            });
            setGenerating(false);
        }
    }, [projectId, supabase, outline, setGenerating, fetchData, handleApiError, handleDbError]);

    return {
        executeAIGeneration,
        executeSubsectionGeneration,
        executeTaskGeneration,
        executeTaskGenerationWithType,
    };
}
