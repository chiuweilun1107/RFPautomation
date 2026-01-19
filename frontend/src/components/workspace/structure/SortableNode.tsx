"use client";

import React from 'react';
import { Section } from '../types';
import { SortableSectionRaw } from './SortableSectionRaw';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface SortableNodeProps {
    section: Section;
    depth: number;
    renderSection: (section: Section, depth?: number, dragHandleProps?: any) => React.ReactNode;
    expandedSections: Set<string>;
}

export function SortableNode({ section, depth, renderSection, expandedSections }: SortableNodeProps) {
    const isExpanded = expandedSections.has(section.id);

    return (
        <div className="space-y-1">
            <SortableSectionRaw section={section} depth={depth} renderSection={renderSection} />

            {isExpanded && section.children && section.children.length > 0 && (
                <div className="ml-4 pl-2 border-l border-gray-100 dark:border-gray-800">
                    <SortableContext
                        items={section.children.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {section.children.map(child => (
                            <SortableNode
                                key={child.id}
                                section={child}
                                depth={depth + 1}
                                renderSection={renderSection}
                                expandedSections={expandedSections}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}
