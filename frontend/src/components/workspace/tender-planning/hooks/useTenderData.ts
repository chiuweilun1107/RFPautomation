/**
 * useTenderData Hook
 *
 * Handles data fetching and initialization from Supabase.
 * Constructs chapter/section hierarchy from flat database structure.
 */

import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { Chapter, Section, Task } from '../types';

interface UseTenderDataProps {
    projectId: string;
    supabase: SupabaseClient;
    setOutline: React.Dispatch<React.SetStateAction<Chapter[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseTenderDataReturn {
    fetchData: () => Promise<void>;
}

/**
 * Fetch and structure tender data from database
 */
export function useTenderData({
    projectId,
    supabase,
    setOutline,
    setLoading
}: UseTenderDataProps): UseTenderDataReturn {
    const fetchData = useCallback(async () => {
        try {
            // Fetch sections from the sections table
            const { data: sectionsData, error } = await supabase
                .from('sections')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index', { ascending: true });

            if (error) throw error;

            if (sectionsData && sectionsData.length > 0) {
                // Fetch tasks for these sections
                const sectionIds = sectionsData.map((s: Section) => s.id);
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('section_id', sectionIds)
                    .order('created_at', { ascending: true });

                const tasksBySection = (tasksData || []).reduce((acc: Record<string, Task[]>, task: Task) => {
                    if (!acc[task.section_id]) acc[task.section_id] = [];
                    acc[task.section_id].push(task);
                    return acc;
                }, {});

                // Group sections by parent_id to build tree
                const rootSections = sectionsData.filter((s: Section) => s.parent_id === null);
                const childSections = sectionsData.filter((s: Section) => s.parent_id !== null);

                // Build chapters with their child sections
                const chapters: Chapter[] = rootSections.map((root: Section) => ({
                    id: root.id,
                    title: root.title,
                    generation_method: root.generation_method,
                    is_modified: root.is_modified,
                    expanded: true, // Default to expanded
                    sections: childSections
                        .filter((child: Section) => child.parent_id === root.id)
                        .map((child: Section) => ({
                            ...child,
                            generation_method: child.generation_method || 'manual',
                            is_modified: child.is_modified || false,
                            tasks: tasksBySection[child.id] || []
                        }))
                        .sort((a: Section, b: Section) => (a.order_index || 0) - (b.order_index || 0))
                }));

                // Sort chapters
                chapters.sort((a, b) => {
                    const idxA = rootSections.find((r: Section) => r.id === a.id)?.order_index || 0;
                    const idxB = rootSections.find((r: Section) => r.id === b.id)?.order_index || 0;
                    return idxA - idxB;
                });

                setOutline(chapters.length > 0 ? chapters : []);
            } else {
                setOutline([]);
            }
        } catch (error) {
            console.error('Error fetching outline:', error);
            toast.error('Failed to load outline');
        } finally {
            setLoading(false);
        }
    }, [projectId, supabase, setOutline, setLoading]);

    return { fetchData };
}
