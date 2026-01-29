import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Section, Task } from "../types";

// Extended section type with tree structure for WritingTable
export interface WritingSection extends Omit<Section, 'children' | 'tasks'> {
    content: string;
    tasks: Task[];
    children: WritingSection[];
    type?: string;
}

export interface FlatSection {
    id: string;
    title: string;
    parent_id: string | null;
    order_index: number;
}

export interface UseWritingTableDataOptions {
    projectId: string;
}

export interface UseWritingTableDataReturn {
    loading: boolean;
    error: string | null;
    sections: WritingSection[];
    chapters: WritingSection[];
    flatSections: FlatSection[];
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching and building the section tree data for WritingTable
 * Handles data fetching, task grouping, and recursive tree building
 */
export function useWritingTableData({
    projectId,
}: UseWritingTableDataOptions): UseWritingTableDataReturn {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sections, setSections] = useState<WritingSection[]>([]);
    const supabase = createClient();

    /**
     * Build section tree recursively from flat sections data
     */
    const buildSectionTree = useCallback(
        (
            sectionsData: Section[],
            tasksBySection: Record<string, Task[]>,
            parentId: string | null
        ): WritingSection[] => {
            const filteredSections = sectionsData.filter(
                (s) => s.parent_id === parentId
            );

            return filteredSections.map((section) => ({
                ...section,
                content: section.title,
                tasks: tasksBySection[section.id] || [],
                children: buildSectionTree(sectionsData, tasksBySection, section.id),
            }));
        },
        []
    );

    /**
     * Fetch sections and tasks, then build the tree structure
     */
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch Sections
            const { data: sectionsData, error: sectionsError } = await supabase
                .from("sections")
                .select("*")
                .eq("project_id", projectId)
                .order("order_index", { ascending: true });

            if (sectionsError) throw sectionsError;

            // Fetch tasks separately
            const { data: tasksData, error: tasksError } = await supabase
                .from("tasks")
                .select("*")
                .eq("project_id", projectId);

            if (tasksError) throw tasksError;

            // Group tasks by section_id
            const tasksBySection: Record<string, Task[]> = {};
            const orphanTasks: Task[] = [];

            tasksData?.forEach((task: Task) => {
                if (task.section_id) {
                    if (!tasksBySection[task.section_id]) {
                        tasksBySection[task.section_id] = [];
                    }
                    tasksBySection[task.section_id].push(task);
                } else {
                    orphanTasks.push(task);
                }
            });

            // Build the full tree
            const fullTree = buildSectionTree(
                sectionsData || [],
                tasksBySection,
                null
            );

            // Handle orphan tasks by adding them to a virtual root section
            if (orphanTasks.length > 0) {
                fullTree.unshift({
                    id: "virtual-root",
                    title: "General Requirements",
                    content: "General Requirements",
                    type: "chapter",
                    children: [],
                    tasks: orphanTasks,
                    order_index: 0,
                    citations: [],
                });
            }

            setSections(fullTree);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown error occurred";
            console.error("[useWritingTableData] Fetch error:", err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [projectId, supabase, buildSectionTree]);

    // Initial fetch on mount and projectId change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Chapters are top-level sections
    const chapters = useMemo(() => sections, [sections]);

    // Flatten sections for TableOfContentsGenerator
    const flatSections = useMemo((): FlatSection[] => {
        const flatten = (
            items: WritingSection[],
            parentId: string | null = null
        ): FlatSection[] => {
            let result: FlatSection[] = [];

            items.forEach((item, idx) => {
                result.push({
                    id: item.id,
                    title: item.title || item.content,
                    parent_id: parentId,
                    order_index: idx + 1,
                });

                if (item.children && item.children.length > 0) {
                    result = [...result, ...flatten(item.children, item.id)];
                }
            });

            return result;
        };

        return flatten(sections);
    }, [sections]);

    return {
        loading,
        error,
        sections,
        chapters,
        flatSections,
        refetch: fetchData,
    };
}
