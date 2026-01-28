'use client';

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../hooks/useProjects';

interface ProjectGridProps {
  projects: Project[];
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
  enableVirtualization?: boolean;
}

// Use virtual scrolling when list is large (>50 items)
const VIRTUALIZATION_THRESHOLD = 50;

export function ProjectGrid({
  projects,
  onDelete,
  onEdit,
  enableVirtualization = projects.length > VIRTUALIZATION_THRESHOLD
}: ProjectGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on screen size (3 columns for lg+, 2 for md, 1 for mobile)
  const columns = useMemo(() => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= 1024) return 3; // lg breakpoint
    if (width >= 768) return 2;  // md breakpoint
    return 1;
  }, []);

  const rowCount = Math.ceil(projects.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated height of a project card row
    overscan: 2, // Render 2 extra rows for smooth scrolling
    enabled: enableVirtualization,
  });

  if (!enableVirtualization) {
    // Standard grid rendering for small lists
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    );
  }

  // Virtual scrolling for large lists
  return (
    <div
      ref={parentRef}
      className="relative overflow-auto"
      style={{ height: '600px' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowProjects = projects.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-1">
                {rowProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
