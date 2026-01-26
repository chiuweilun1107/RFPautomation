/**
 * useSaveOperations Hook
 *
 * Handles saving tender structure to Supabase.
 * Manages deletes and upserts for chapters and sections.
 */

import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { Chapter } from '../types';

interface UseSaveOperationsProps {
    projectId: string;
    supabase: SupabaseClient;
    outline: Chapter[];
    deletedSectionIds: string[];
    setDeletedSectionIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSaving: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseSaveOperationsReturn {
    handleSave: () => Promise<void>;
}

/**
 * Save tender structure to database
 */
export function useSaveOperations({
    projectId,
    supabase,
    outline,
    deletedSectionIds,
    setDeletedSectionIds,
    setSaving
}: UseSaveOperationsProps): UseSaveOperationsReturn {
    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            // Delete removed sections first
            if (deletedSectionIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('sections')
                    .delete()
                    .in('id', deletedSectionIds);

                if (deleteError) throw deleteError;
            }

            // Upsert all chapters and sections
            for (let i = 0; i < outline.length; i++) {
                const chapter = outline[i];

                // Upsert chapter (root section)
                const { error: chapterError } = await supabase
                    .from('sections')
                    .upsert({
                        id: chapter.id,
                        project_id: projectId,
                        title: chapter.title,
                        parent_id: null,
                        order_index: i + 1,
                        generation_method: chapter.generation_method || 'manual',
                        is_modified: chapter.is_modified || false
                    });
                if (chapterError) throw chapterError;

                // Upsert child sections
                for (let j = 0; j < chapter.sections.length; j++) {
                    const section = chapter.sections[j];
                    const { error: sectionError } = await supabase
                        .from('sections')
                        .upsert({
                            id: section.id,
                            project_id: projectId,
                            title: section.title,
                            parent_id: chapter.id,
                            order_index: j + 1,
                            generation_method: section.generation_method || 'manual',
                            is_modified: section.is_modified || false
                        });
                    if (sectionError) throw sectionError;
                }
            }

            setDeletedSectionIds([]);
            toast.success("Proposal Outline Saved", {
                description: "Your changes have been committed to the database."
            });
        } catch (error: unknown) {
            console.error("Error saving outline:", error);
            toast.error("Save Failed", {
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    }, [projectId, supabase, outline, deletedSectionIds, setDeletedSectionIds, setSaving]);

    return { handleSave };
}
