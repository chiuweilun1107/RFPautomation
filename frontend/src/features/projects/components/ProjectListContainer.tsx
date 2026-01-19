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
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { useProjects, type Project } from '../hooks/useProjects';
import { useProjectFilters } from '../hooks/useProjectFilters';
import { ProjectToolbar } from './ProjectToolbar';
import { ProjectGrid } from './ProjectGrid';
import { ProjectPagination } from './ProjectPagination';
import { ProjectEmptyState } from './ProjectEmptyState';

export function ProjectListContainer() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
  } = useProjectFilters(projects);

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
    return (
      <>
        <ProjectEmptyState />
        <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <ProjectToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalCount={totalCount}
        onCreateProject={() => setCreateDialogOpen(true)}
      />

      {/* Projects Grid/List */}
      {paginatedProjects.length > 0 ? (
        <>
          <ProjectGrid
            projects={paginatedProjects}
            onDelete={setProjectToDelete}
          />

          {/* Pagination */}
          <ProjectPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
