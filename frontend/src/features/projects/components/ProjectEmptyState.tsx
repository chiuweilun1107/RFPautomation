import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectEmptyStateProps {
  isFiltered?: boolean;
}

export function ProjectEmptyState({
  isFiltered = false,
}: ProjectEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No projects found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Try adjusting your search query to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Get started by creating your first project. You can add proposals,
        assessments, and track your progress.
      </p>
    </div>
  );
}
