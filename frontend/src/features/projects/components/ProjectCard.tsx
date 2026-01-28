import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  LayoutGrid,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '../hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
}

// Helper to parse dates including ROC years (e.g. 115年)
const parseFlexibleDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "PENDING";

  // 1. Try standard date parse
  const stdDate = new Date(dateStr);
  if (!isNaN(stdDate.getTime())) return stdDate.toLocaleDateString();

  // 2. Try ROC Year format: 115年1月27日 -> 2026/1/27
  const rocMatch = dateStr.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
  if (rocMatch) {
    const year = parseInt(rocMatch[1]) + 1911;
    const month = parseInt(rocMatch[2]);
    const day = parseInt(rocMatch[3]);
    return new Date(year, month - 1, day).toLocaleDateString();
  }

  // 3. Fallback to raw string
  return dateStr;
};

function ProjectCardComponent({ project, onDelete, onEdit }: ProjectCardProps) {
  const router = useRouter();

  const statusClassName = project.status === 'processing'
    ? 'bg-amber-400 text-black border-black'
    : project.status === 'active'
      ? 'bg-emerald-500 text-white border-black'
      : project.status === 'completed'
        ? 'bg-blue-600 text-white border-black'
        : 'bg-white text-black border-black';

  return (
    <Card
      onClick={() => router.push(`/dashboard/${project.id}`)}
      className="group relative flex flex-col overflow-visible border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] cursor-pointer"
    >
      <CardHeader className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Badge
            className={`rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5 ${statusClassName}`}
          >
            {project.status === 'processing' && (
              <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin inline-block" />
            )}
            {project.status.toUpperCase()}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-none border-black dark:border-white font-mono text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${project.id}`} className="w-full">
                  OPEN_PROJECT
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                EDIT_INFO
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
              <DropdownMenuItem
                className="text-red-600 focus:text-white focus:bg-red-600 rounded-none cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                DELETE
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-black leading-[1.1] font-mono tracking-tighter uppercase group-hover:text-[#FA4028] transition-colors line-clamp-2">
            {project.title}
          </CardTitle>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-2">
          {/* Agency Banner */}
          <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
              <LayoutGrid className="h-3.5 w-3.5" />
              Agency_Entity
            </div>
            <div className="text-xl font-black font-mono text-foreground break-words leading-tight line-clamp-1">
              {project.agency || "UNDEFINED_DATA"}
            </div>
          </div>

          {/* Deadline Banner */}
          <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
              <Calendar className="h-3.5 w-3.5" />
              Deadline_Sequence
            </div>
            <div className="text-xl font-black font-mono text-foreground leading-tight">
              {parseFlexibleDate(project.deadline) !== "PENDING"
                ? parseFlexibleDate(project.deadline)
                : "PENDING_STAMP"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
          <span>Upd: {new Date(project.updated_at).toLocaleDateString()}</span>
          <span>Cre: {new Date(project.created_at).toLocaleDateString()}</span>
        </div>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
      prevProps.project.updated_at === nextProps.project.updated_at &&
      prevProps.project.agency === nextProps.project.agency &&
      prevProps.project.deadline === nextProps.project.deadline
    );
  }
);

ProjectCard.displayName = 'ProjectCard';
