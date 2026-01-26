"use client";

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskItemProps {
    id: string;
    sectionId: string;
    children: (props: { attributes: any; listeners: any; isDragging: boolean }) => React.ReactNode;
}

function SortableTaskItemComponent({ id, sectionId, children }: SortableTaskItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, data: { type: 'task', sectionId } });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative',
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children({ attributes, listeners, isDragging })}
        </div>
    );
}

/**
 * Memoized SortableTaskItem wrapper
 * Prevents re-renders when ID and sectionId haven't changed
 */
export const SortableTaskItem = memo(
    SortableTaskItemComponent,
    (prevProps, nextProps) => {
        // Only re-render if ID or sectionId changes
        // Children function is stable if parent memoizes properly
        return (
            prevProps.id === nextProps.id &&
            prevProps.sectionId === nextProps.sectionId
        );
    }
);
