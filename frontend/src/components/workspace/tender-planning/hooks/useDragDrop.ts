/**
 * useDragDrop Hook
 *
 * Handles drag-and-drop functionality for chapters and sections.
 * Supports reordering within the same level.
 */

import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Chapter } from '../types';

interface UseDragDropProps {
    outline: Chapter[];
    setOutline: React.Dispatch<React.SetStateAction<Chapter[]>>;
}

interface UseDragDropReturn {
    handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Drag-and-drop event handling
 */
export function useDragDrop({ outline, setOutline }: UseDragDropProps): UseDragDropReturn {
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setOutline((prev) => {
            const newOutline = [...prev];

            // 1. Try to find if it's a chapter move
            const oldChapterIndex = prev.findIndex(c => c.id === active.id);
            const newChapterIndex = prev.findIndex(c => c.id === over.id);

            if (oldChapterIndex !== -1 && newChapterIndex !== -1) {
                return arrayMove(newOutline, oldChapterIndex, newChapterIndex).map(item => ({ ...item, is_modified: true }));
            }

            // 2. Try to find if it's a section move within same chapter
            for (let i = 0; i < newOutline.length; i++) {
                const chapter = newOutline[i];
                const sections = chapter.sections || [];
                const oldSectionIndex = sections.findIndex(s => s.id === active.id);
                const newSectionIndex = sections.findIndex(s => s.id === over.id);

                if (oldSectionIndex !== -1 && newSectionIndex !== -1) {
                    const newSections = arrayMove([...sections], oldSectionIndex, newSectionIndex);
                    newOutline[i] = {
                        ...chapter,
                        sections: newSections.map((s, idx) => ({ ...s, order_index: idx + 1 })),
                        is_modified: true
                    };
                    return newOutline;
                }
            }

            return prev;
        });
    }, [setOutline]);

    return { handleDragEnd };
}
