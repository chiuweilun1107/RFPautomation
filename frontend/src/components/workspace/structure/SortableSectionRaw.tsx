"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Section } from '../types';

interface SortableSectionRawProps {
    section: Section;
    depth: number;
    renderSection: (section: Section, depth?: number, dragHandleProps?: any) => React.ReactNode;
}

export function SortableSectionRaw({ section, depth, renderSection }: SortableSectionRawProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({ id: section.id, data: { type: 'section' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={`rounded-lg transition-colors ${isOver ? 'bg-blue-50 ring-2 ring-blue-500/20 z-10' : ''}`}>
            {renderSection(section, depth, { attributes, listeners })}
        </div>
    );
}
