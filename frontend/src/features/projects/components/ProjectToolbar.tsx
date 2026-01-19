import { LayoutGrid, List as ListIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectToolbarProps {
  viewMode: 'grid' | 'list' | 'calendar';
  onViewModeChange: (mode: 'grid' | 'list' | 'calendar') => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  totalCount: number;
}

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

export function ProjectToolbar({
  viewMode,
  onViewModeChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalCount,
}: ProjectToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
        <div className="flex border border-black dark:border-white h-10 p-1 bg-white dark:bg-black shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-none h-full px-3 transition-colors',
              viewMode === 'grid'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'hover:bg-muted text-muted-foreground'
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-none h-full px-3 transition-colors',
              viewMode === 'list'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'hover:bg-muted text-muted-foreground'
            )}
            onClick={() => onViewModeChange('list')}
          >
            <ListIcon className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-none h-full px-3 transition-colors',
              viewMode === 'calendar'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'hover:bg-muted text-muted-foreground'
            )}
            onClick={() => onViewModeChange('calendar')}
          >
            <Calendar className="h-4 w-4" />
            <span className="sr-only">Calendar view</span>
          </Button>
        </div>
      </div>

      {/* Right section: Items per page and total count */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FA4028]">
            PROJECTS_ACTIVE
          </span>
          <span className="text-xl font-black font-mono leading-none">
            {String(totalCount).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
