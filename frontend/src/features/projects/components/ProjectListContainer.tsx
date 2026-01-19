'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useProjects, type Project } from '../hooks/useProjects';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { ProjectToolbar } from './ProjectToolbar';
import { ProjectGrid } from './ProjectGrid';
import { ProjectListView } from './ProjectListView';
import { ProjectPagination } from './ProjectPagination';
import { ProjectEmptyState } from './ProjectEmptyState';
import { ProjectCalendarView } from './ProjectCalendarView';

export function ProjectListContainer({ externalSearchQuery = "" }: { externalSearchQuery?: string }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Fetch projects with realtime updates
  const { projects, loading, deleteProject } = useProjects();

  // Handle filtering and pagination
  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedProjects,
    totalPages,
    totalCount,
    filteredProjects, // We need the full filtered list for date drill-down
  } = useProjectFilters(projects);

  // Helper to parse dates (consistent with views)
  const parseDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    const stdDate = new Date(dateStr);
    if (!isNaN(stdDate.getTime())) return stdDate;
    const rocMatch = dateStr.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
    if (rocMatch) {
      const year = parseInt(rocMatch[1]) + 1911;
      const month = parseInt(rocMatch[2]);
      const day = parseInt(rocMatch[3]);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  // Memoized drill-down results when a calendar date is clicked
  const drillDownProjects = React.useMemo(() => {
    if (!selectedDate) return paginatedProjects;

    return filteredProjects.filter(p => {
      const d = parseDate(p.deadline);
      if (!d) return false;
      return (
        d.getDate() === selectedDate.getDate() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [filteredProjects, paginatedProjects, selectedDate]);

  // Sync external search query
  React.useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery, setSearchQuery]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    const { success, error } = await deleteProject(projectToDelete.id);

    if (success) {
      toast.success('Project deleted successfully');
      setProjectToDelete(null);
    } else {
      toast.error('Failed to delete project');
      console.error('Delete error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return <ProjectEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <ProjectToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalCount={totalCount}
      />

      {/* Selection Info / Clear Filter */}
      {selectedDate && (
        <div className="flex items-center justify-between p-4 bg-[#FA4028] text-white font-mono rounded-none mb-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Filtered_By_Date</span>
            <span className="text-sm font-black underline underline-offset-4">
              {selectedDate.toLocaleDateString()}
            </span>
            <span className="text-[10px] font-black opacity-60">// {drillDownProjects.length} PROJECTS_FOUND</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(null)}
            className="h-7 rounded-none border border-white hover:bg-white hover:text-[#FA4028] text-[10px] font-black uppercase"
          >
            Clear_Filter [X]
          </Button>
        </div>
      )}

      {/* Projects Grid/List/Calendar */}
      {(selectedDate ? drillDownProjects : paginatedProjects).length > 0 ? (
        <>
          {viewMode === 'grid' && (
            <ProjectGrid
              projects={selectedDate ? drillDownProjects : paginatedProjects}
              onDelete={setProjectToDelete}
            />
          )}
          {viewMode === 'list' && (
            <ProjectListView
              projects={selectedDate ? drillDownProjects : paginatedProjects}
              onDelete={setProjectToDelete}
            />
          )}
          {viewMode === 'calendar' && (
            <ProjectCalendarView
              projects={projects}
              onDayClick={(date) => {
                setSelectedDate(date);
                setViewMode('grid'); // Auto-switch to grid to show the specific projects
              }}
            />
          )}

          {/* Pagination - Keep metadata visible but handle filtered state */}
          {viewMode !== 'calendar' && (
            <ProjectPagination
              currentPage={selectedDate ? 1 : currentPage}
              totalPages={selectedDate ? 1 : totalPages}
              pageSize={itemsPerPage}
              totalCount={selectedDate ? drillDownProjects.length : totalCount}
              onPageChange={setCurrentPage}
              onPageSizeChange={setItemsPerPage}
            />
          )}
        </>
      ) : (
        <ProjectEmptyState isFiltered={searchQuery.length > 0} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
