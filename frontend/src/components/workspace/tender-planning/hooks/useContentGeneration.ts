/**
 * useContentGeneration Hook
 *
 * Handles WF12 Content Generation workflows:
 * - Single Task Content Generation
 * - Batch Section Content Generation
 */

import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors';
import type { Chapter } from '../types';

interface UseContentGenerationProps {
    projectId: string;
    supabase: SupabaseClient;
    outline: Chapter[];
    setGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    fetchData: () => Promise<void>;
}

interface UseContentGenerationReturn {
    executeContentGeneration: (taskId: string, taskText: string, sectionId: string, sectionTitle: string, sourceIds: string[]) => Promise<void>;
    executeSectionContentGeneration: (sectionId: string, sectionTitle: string, tasks: { id: string, requirement_text: string }[], sourceIds: string[]) => Promise<void>;
}

export function useContentGeneration({
    projectId,
    supabase,
    outline,
    setGenerating,
    fetchData
}: UseContentGenerationProps): UseContentGenerationReturn {
    const { handleApiError } = useErrorHandler();

    // WF12: Generate content for a single task
    const executeContentGeneration = useCallback(async (
        taskId: string,
        taskText: string,
        sectionId: string,
        sectionTitle: string,
        sourceIds: string[]
    ) => {
        setGenerating(true);
        logger.info('Starting Content Generation (Single)', 'TenderPlanning:WF12', { taskId, sectionId });

        try {
            // Gather all section titles for context (flattened)
            const allSections = outline.flatMap(c =>
                [c.title, ...(c.sections?.map(s => s.title) || [])]
            );

            const response = await fetch('/api/webhook/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'task',
                    projectId,
                    sectionId,
                    sectionTitle,
                    taskId,
                    taskText,
                    selectedSourceIds: sourceIds,
                    allSections
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Generation failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(`內容生成成功！(${result.wordCount || 0}字)`);
                // Wait a bit for DB to propagate if needed, though fetchData should get it
                setTimeout(() => {
                    fetchData();
                    setGenerating(false);
                }, 1000);
            } else {
                throw new Error(result.error || "Unknown generation error");
            }

        } catch (error) {
            handleApiError(error, 'TenderPlanning:WF12', {
                userMessage: '內容生成失敗Failed to generate content.',
                metadata: { taskId, projectId }
            });
            setGenerating(false);
        }
    }, [projectId, outline, setGenerating, fetchData, handleApiError]);

    // WF12: Generate content for a whole section (batch)
    const executeSectionContentGeneration = useCallback(async (
        sectionId: string,
        sectionTitle: string,
        tasks: { id: string, requirement_text: string }[],
        sourceIds: string[]
    ) => {
        setGenerating(true);
        logger.info('Starting Content Generation (Batch)', 'TenderPlanning:WF12', { sectionId, taskCount: tasks.length });

        try {
            // Gather all section titles for context
            const allSections = outline.flatMap(c =>
                [c.title, ...(c.sections?.map(s => s.title) || [])]
            );

            const response = await fetch('/api/webhook/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'section',
                    projectId,
                    sectionId,
                    sectionTitle,
                    tasks: tasks.map(t => ({
                        id: t.id,
                        requirement_text: t.requirement_text
                    })),
                    selectedSourceIds: sourceIds,
                    allSections
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Batch generation failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                toast.success(`章節內容生成成功！`);
                setTimeout(() => {
                    fetchData();
                    setGenerating(false);
                }, 2000);
            } else {
                throw new Error(result.error || "Unknown batch generation error");
            }

        } catch (error) {
            handleApiError(error, 'TenderPlanning:WF12', {
                userMessage: '批量生成失敗 Failed to generate batch content.',
                metadata: { sectionId, projectId }
            });
            setGenerating(false);
        }
    }, [projectId, outline, setGenerating, fetchData, handleApiError]);

    return {
        executeContentGeneration,
        executeSectionContentGeneration
    };
}
