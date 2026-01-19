import { memo } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Project } from '../hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
}

const statusConfig = {
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  completed: {
    label: 'Completed',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  },
};

function ProjectCardComponent({ project, onDelete }: ProjectCardProps) {
  const status = statusConfig[project.status];
  const assessmentCount =
    Array.isArray(project.project_assessments)
      ? project.project_assessments.length
      : 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/${project.id}`}
            className="flex-1 min-w-0"
            prefetch={true}
          >
            <CardTitle className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
              {project.title}
            </CardTitle>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${project.id}`}>Open Project</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs font-medium', status.className)}>
            {status.label}
          </Badge>
          {assessmentCount > 0 && (
            <Badge variant="outline" className="text-xs">
              <FileText className="mr-1 h-3 w-3" />
              {assessmentCount} assessments
            </Badge>
          )}
        </div>

        {project.agency && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Agency:</span> {project.agency}
          </div>
        )}

        {project.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ProjectCard = memo(
  ProjectCardComponent,
  (prevProps, nextProps) => {
    // Only re-render if project data has changed
    return (
      prevProps.project.id === nextProps.project.id &&
      prevProps.project.title === nextProps.project.title &&
      prevProps.project.status === nextProps.project.status &&
      prevProps.project.updated_at === nextProps.project.updated_at
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
