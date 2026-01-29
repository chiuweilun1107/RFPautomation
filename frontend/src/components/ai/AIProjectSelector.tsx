'use client';

import { useState, useRef, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, Check, X, FileText } from 'lucide-react';
import { SourceSelectionDialog } from '@/components/workspace/dialogs/SourceSelectionDialog';
import { useDraggableDialog } from '@/hooks';
import {
  useAIProjectSelection,
  getProjectField,
  formatDate,
} from './hooks/useAIProjectSelection';

interface AIProjectSelectorProps {
  onProjectChange?: (projectId: string | null) => void;
}

// Helper for SSR-safe window width detection
const subscribeToWindowSize = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};
const getWindowWidth = () => (typeof window !== 'undefined' ? window.innerWidth : 1200);
const getServerWidth = () => 1200;

/**
 * AI Project Selector
 *
 * Floating panel in the top-right corner for selecting AI reference project
 */
export function AIProjectSelector({ onProjectChange }: AIProjectSelectorProps) {
  // SSR-safe window width using useSyncExternalStore
  const windowWidth = useSyncExternalStore(subscribeToWindowSize, getWindowWidth, getServerWidth);

  // Project selection state
  const {
    projects,
    selectedProjectId,
    selectedProject,
    selectedSourceIds,
    loading,
    open,
    isSourceDialogOpen,
    setOpen,
    setIsSourceDialogOpen,
    handleSelectProject,
    handleConfirmSources,
  } = useAIProjectSelection({ onProjectChange });

  // Collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ref for container element
  const nodeRef = useRef<HTMLDivElement>(null);

  // Calculate initial position based on window width (right side of screen)
  const initialX = Math.max(0, windowWidth - 520);

  // Initialize draggable dialog with useDraggableDialog hook
  const {
    position,
    isDragging,
    handleMouseDown,
    dialogStyle,
  } = useDraggableDialog({
    initialPosition: { x: initialX, y: 20 },
    dialogWidth: 500,
    handleHeight: 48,
    bounds: {
      minX: -460, // Allow partial off-screen
      minY: 0,
    },
  });

  // Handle collapse/expand
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        ref={nodeRef}
        className="fixed z-50 cursor-move bg-[#FA4028] border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex items-center justify-center w-12 h-12"
        style={{
          left: position.x,
          top: position.y,
          transition: isDragging ? 'none' : 'none',
        }}
        onMouseDown={handleMouseDown}
        onClick={toggleCollapse}
        title="Click to expand AI Project Selector"
      >
        <span className="text-white font-black text-2xl font-mono select-none pointer-events-none">
          K
        </span>
      </div>
    );
  }

  return (
    <div
      ref={nodeRef}
      className="fixed z-50 bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)] flex flex-col overflow-hidden"
      style={{
        ...dialogStyle,
        width: 'auto',
        maxWidth: '500px',
        transition: isDragging ? 'none' : 'none',
      }}
    >
      {/* Red drag handle - Header */}
      <div
        className="cursor-move p-2 border-b-2 border-black dark:border-white bg-[#FA4028] text-white flex justify-between items-center shrink-0 select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider font-mono">
            AI_PROJECT_SELECTOR
          </span>
        </div>

        {/* Collapse button */}
        <div
          className="cursor-pointer hover:bg-white/20 rounded p-0.5 transition-colors"
          onClick={toggleCollapse}
          onMouseDown={(e) => e.stopPropagation()}
          title="Collapse"
        >
          <div className="w-3 h-0.5 bg-white" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex gap-2 items-center p-3 bg-white dark:bg-zinc-950">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={selectedProject ? 'default' : 'outline'}
              size="sm"
              className="gap-2 rounded-none border-black dark:border-white hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028]"
            >
              <FolderOpen className="w-4 h-4" />
              {selectedProject ? (
                <span className="max-w-[200px] truncate font-bold text-xs uppercase">
                  {getProjectField(selectedProject, 'name') || 'Unnamed Project'}
                </span>
              ) : (
                <span className="font-bold text-xs uppercase">AI Reference Project</span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-[350px] max-h-[500px] overflow-y-auto rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] font-mono"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase font-bold">
              Select project data for AI reference
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />

            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground uppercase font-bold">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground uppercase font-bold">
                No projects
              </div>
            ) : (
              <>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate uppercase">
                          {getProjectField(project, 'name') || 'Unnamed Project'}
                        </div>
                        {getProjectField(project, 'agency') && (
                          <div className="text-xs text-muted-foreground truncate">
                            {getProjectField(project, 'agency')}
                          </div>
                        )}
                        {getProjectField(project, 'deadline') && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(getProjectField(project, 'deadline'))}
                          </div>
                        )}
                      </div>
                      {selectedProjectId === project.id && (
                        <Check className="w-4 h-4 text-[#FA4028] ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />

                <DropdownMenuItem
                  onClick={() => handleSelectProject(null)}
                  className="flex items-center justify-between gap-2 cursor-pointer text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">No project data</span>
                  </div>
                  {!selectedProjectId && <Check className="w-4 h-4 text-[#FA4028]" />}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Show selected documents count or prompt to select */}
        {selectedProject && (
          <Button
            variant={selectedSourceIds.length > 0 ? 'default' : 'outline'}
            size="sm"
            className="gap-2 rounded-none border-black dark:border-white hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028]"
            onClick={() => setIsSourceDialogOpen(true)}
          >
            <FileText className="w-4 h-4" />
            <span className="font-bold text-xs uppercase">
              {selectedSourceIds.length > 0
                ? `${selectedSourceIds.length} documents`
                : 'Select documents'}
            </span>
          </Button>
        )}
      </div>

      {/* Source selection dialog */}
      {selectedProjectId && (
        <SourceSelectionDialog
          open={isSourceDialogOpen}
          onOpenChange={setIsSourceDialogOpen}
          projectId={selectedProjectId}
          onConfirm={handleConfirmSources}
          title="Select AI Reference Documents"
          description="Select documents for AI to reference (optional, can use project info only)"
        />
      )}
    </div>
  );
}
