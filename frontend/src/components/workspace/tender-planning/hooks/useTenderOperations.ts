/**
 * useTenderOperations Hook
 *
 * CRUD operations for chapters and sections.
 * Handles adding, updating, deleting, and toggling items.
 */

import { useCallback } from 'react';
import type { Chapter } from '../types';

interface UseTenderOperationsProps {
    outline: Chapter[];
    setOutline: React.Dispatch<React.SetStateAction<Chapter[]>>;
    setDeletedSectionIds: React.Dispatch<React.SetStateAction<string[]>>;
}

interface UseTenderOperationsReturn {
    toggleChapter: (index: number) => void;
    toggleSectionTasks: (cIndex: number, sIndex: number) => void;
    updateChapterTitle: (index: number, newTitle: string) => void;
    updateSectionTitle: (cIndex: number, sIndex: number, newTitle: string) => void;
    addChapter: () => void;
    deleteChapter: (index: number) => void;
    addSection: (chapterIndex: number, method?: 'manual' | 'ai_gen' | 'template') => void;
    deleteSection: (cIndex: number, sIndex: number) => void;
}

/**
 * Provide all CRUD operations for chapters and sections
 */
export function useTenderOperations({
    outline,
    setOutline,
    setDeletedSectionIds
}: UseTenderOperationsProps): UseTenderOperationsReturn {
    const toggleChapter = useCallback((cIndex: number) => {
        setOutline(prev => {
            const newOutline = [...prev];
            const newChapter = { ...newOutline[cIndex] };
            newChapter.expanded = !newChapter.expanded;
            newOutline[cIndex] = newChapter;
            return newOutline;
        });
    }, [setOutline]);

    const toggleSectionTasks = useCallback((cIndex: number, sIndex: number) => {
        setOutline(prev => {
            const newOutline = [...prev];
            const newChapter = { ...newOutline[cIndex] };
            const newSections = [...(newChapter.sections || [])];
            if (newSections[sIndex]) {
                const newSection = { ...newSections[sIndex] };
                newSection.expanded = !newSection.expanded;
                newSections[sIndex] = newSection;
                newChapter.sections = newSections;
                newOutline[cIndex] = newChapter;
            }
            return newOutline;
        });
    }, [setOutline]);

    const updateChapterTitle = useCallback((index: number, newTitle: string) => {
        setOutline(prev => {
            const newOutline = [...prev];
            newOutline[index] = {
                ...newOutline[index],
                title: newTitle,
                is_modified: true
            };
            return newOutline;
        });
    }, [setOutline]);

    const updateSectionTitle = useCallback((cIndex: number, sIndex: number, newTitle: string) => {
        setOutline(prev => {
            const newOutline = [...prev];
            if (!newOutline[cIndex].sections) newOutline[cIndex].sections = [];
            newOutline[cIndex].sections[sIndex] = {
                ...newOutline[cIndex].sections[sIndex],
                title: newTitle,
                is_modified: true
            };
            return newOutline;
        });
    }, [setOutline]);

    const addChapter = useCallback(() => {
        setOutline(prev => [...prev, {
            id: crypto.randomUUID(),
            title: "New Chapter",
            sections: [],
            generation_method: 'manual',
            is_modified: false
        }]);
    }, [setOutline]);

    const deleteChapter = useCallback((index: number) => {
        setOutline(prev => {
            const chapter = prev[index];
            const idsToDelete = [chapter.id, ...chapter.sections.map(s => s.id)];
            setDeletedSectionIds(current => [...current, ...idsToDelete]);

            const newOutline = [...prev];
            newOutline.splice(index, 1);
            return newOutline;
        });
    }, [setOutline, setDeletedSectionIds]);

    const addSection = useCallback((chapterIndex: number, method: 'manual' | 'ai_gen' | 'template' = 'manual') => {
        setOutline(prev => {
            const newOutline = [...prev];
            if (!newOutline[chapterIndex].sections) newOutline[chapterIndex].sections = [];
            newOutline[chapterIndex].sections.push({
                id: crypto.randomUUID(),
                title: method === 'manual' ? "New Section" : (method === 'ai_gen' ? "New AI Section" : "New Template Section"),
                parent_id: newOutline[chapterIndex].id,
                order_index: newOutline[chapterIndex].sections.length + 1,
                generation_method: method,
                is_modified: false
            });
            return newOutline;
        });
    }, [setOutline]);

    const deleteSection = useCallback((cIndex: number, sIndex: number) => {
        setOutline(prev => {
            const section = prev[cIndex].sections[sIndex];
            setDeletedSectionIds(current => [...current, section.id]);

            const newOutline = [...prev];
            newOutline[cIndex].sections.splice(sIndex, 1);
            return newOutline;
        });
    }, [setOutline, setDeletedSectionIds]);

    return {
        toggleChapter,
        toggleSectionTasks,
        updateChapterTitle,
        updateSectionTitle,
        addChapter,
        deleteChapter,
        addSection,
        deleteSection,
    };
}
