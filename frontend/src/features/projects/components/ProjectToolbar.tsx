import { Search, LayoutGrid, List as ListIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ProjectToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  totalCount: number;
  onCreateProject: () => void;
}

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

export function ProjectToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalCount,
  onCreateProject,
}: ProjectToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Left section: Search and view mode */}
      <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-950"
          />
        </div>

        <div className="flex items-center gap-1 border rounded-lg p-1 bg-white dark:bg-gray-950">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              viewMode === 'grid' && 'bg-gray-100 dark:bg-gray-800'
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              viewMode === 'list' && 'bg-gray-100 dark:bg-gray-800'
            )}
            onClick={() => onViewModeChange('list')}
          >
            <ListIcon className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
        </div>
      </div>

      {/* Right section: Items per page, count, and create button */}
      <div className="flex items-center gap-3">
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
        >
          <SelectTrigger className="w-[100px] bg-white dark:bg-gray-950">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalCount} {totalCount === 1 ? 'project' : 'projects'}
        </span>

        <Button onClick={onCreateProject} className="gap-2 whitespace-nowrap">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
