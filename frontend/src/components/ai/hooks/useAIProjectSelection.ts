import { useState, useEffect, useCallback } from 'react';

/**
 * Project interface with flexible field access
 */
export interface Project {
  id: string;
  [key: string]: unknown;
}

/**
 * AI Project Selection state and handlers
 */
export interface UseAIProjectSelectionReturn {
  /** List of available projects */
  projects: Project[];
  /** Currently selected project ID */
  selectedProjectId: string | null;
  /** Currently selected project object */
  selectedProject: Project | null;
  /** Selected source/document IDs */
  selectedSourceIds: string[];
  /** Whether projects are loading */
  loading: boolean;
  /** Whether dropdown is open */
  open: boolean;
  /** Whether source dialog is open */
  isSourceDialogOpen: boolean;
  /** Set dropdown open state */
  setOpen: (open: boolean) => void;
  /** Set source dialog open state */
  setIsSourceDialogOpen: (open: boolean) => void;
  /** Handle project selection */
  handleSelectProject: (project: Project | null) => Promise<void>;
  /** Handle source confirmation */
  handleConfirmSources: (sourceIds: string[]) => Promise<void>;
}

interface UseAIProjectSelectionOptions {
  /** Callback when project changes */
  onProjectChange?: (projectId: string | null) => void;
}

/**
 * Utility to get project field value with flexible field mapping
 */
export function getProjectField(
  project: Project | null,
  fieldType: 'name' | 'agency' | 'deadline'
): string | undefined {
  if (!project) return undefined;

  const fieldMaps: Record<string, string[]> = {
    name: ['name', 'title', 'project_name', 'tender_name', 'tender_title'],
    agency: ['agency_entity', 'agency', 'agency_name', 'organization'],
    deadline: ['deadline_sequence', 'deadline', 'deadline_date', 'due_date', 'end_date'],
  };

  const possibleFields = fieldMaps[fieldType];

  for (const field of possibleFields) {
    const value = project[field];
    if (value && typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

/**
 * Format date string to locale format
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('zh-TW');
  } catch {
    return dateString;
  }
}

/**
 * Hook for managing AI project selection state and logic
 */
export function useAIProjectSelection(
  options: UseAIProjectSelectionOptions = {}
): UseAIProjectSelectionReturn {
  const { onProjectChange } = options;

  // Project list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  // UI state
  const [open, setOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

  // Load preferences from database/localStorage on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch('/api/user/ai-preferences');
        const data = await response.json();

        if (data.selectedProjectId && data.selectedProjectId !== 'null') {
          setSelectedProjectId(data.selectedProjectId);
          localStorage.setItem('ai_selected_project_id', data.selectedProjectId);
        } else {
          localStorage.removeItem('ai_selected_project_id');
          localStorage.removeItem('ai_selected_source_ids');
          setSelectedProjectId(null);
          setSelectedProject(null);
          setSelectedSourceIds([]);
        }

        if (data.selectedProjectId && data.selectedSourceIds && Array.isArray(data.selectedSourceIds)) {
          setSelectedSourceIds(data.selectedSourceIds);
          localStorage.setItem('ai_selected_source_ids', JSON.stringify(data.selectedSourceIds));
        }

        if (data.userId) {
          localStorage.setItem('ai_user_id', data.userId);
        }
      } catch {
        // Fallback to localStorage
        const savedProjectId = localStorage.getItem('ai_selected_project_id');
        if (savedProjectId && savedProjectId !== 'null') {
          setSelectedProjectId(savedProjectId);
        }

        const savedSourceIds = localStorage.getItem('ai_selected_source_ids');
        if (savedSourceIds) {
          try {
            const sourceIds = JSON.parse(savedSourceIds);
            if (Array.isArray(sourceIds)) {
              setSelectedSourceIds(sourceIds);
            }
          } catch {
            // Silent handling
          }
        }
      }
    }

    loadPreferences();
  }, []);

  // Fetch projects list
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects/list');
        const result = await response.json();

        if (!response.ok) {
          return;
        }

        setProjects(result.projects || []);

        if (selectedProjectId && result.projects) {
          const project = result.projects.find((p: Project) => p.id === selectedProjectId);
          if (project) {
            setSelectedProject(project);
          }
        }
      } catch {
        // Silent handling
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [selectedProjectId]);

  // Handle project selection
  const handleSelectProject = useCallback(
    async (project: Project | null) => {
      const projectId = project?.id || null;

      if (!projectId) {
        setSelectedProjectId(null);
        setSelectedProject(null);
        setSelectedSourceIds([]);
        setOpen(false);
        localStorage.removeItem('ai_selected_project_id');
        localStorage.removeItem('ai_selected_source_ids');
        localStorage.removeItem('ai_user_id');
        document.cookie = 'ai_project_id=; path=/; max-age=0';
        document.cookie = 'ai_source_ids=; path=/; max-age=0';

        try {
          await fetch('/api/user/ai-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: null,
              sourceIds: [],
            }),
          });
        } catch {
          // Silent handling
        }

        window.dispatchEvent(
          new CustomEvent('ai-project-changed', {
            detail: { projectId: null, sourceIds: [] },
          })
        );

        onProjectChange?.(null);
        return;
      }

      setSelectedProjectId(projectId);
      setSelectedProject(project);
      setOpen(false);
      setIsSourceDialogOpen(true);
    },
    [onProjectChange]
  );

  // Handle source confirmation
  const handleConfirmSources = useCallback(
    async (sourceIds: string[]) => {
      setSelectedSourceIds(sourceIds);

      if (selectedProjectId) {
        localStorage.setItem('ai_selected_project_id', selectedProjectId);
        localStorage.setItem('ai_selected_source_ids', JSON.stringify(sourceIds));

        const isSecure = window.location.protocol === 'https:';
        const projectCookie = `ai_project_id=${selectedProjectId}; path=/; max-age=2592000; ${isSecure ? 'Secure; SameSite=None' : 'SameSite=Lax'}`;
        const sourcesCookie = `ai_source_ids=${encodeURIComponent(JSON.stringify(sourceIds))}; path=/; max-age=2592000; ${isSecure ? 'Secure; SameSite=None' : 'SameSite=Lax'}`;

        document.cookie = projectCookie;
        document.cookie = sourcesCookie;
      }

      try {
        await fetch('/api/user/ai-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProjectId,
            sourceIds,
          }),
        });
      } catch {
        // Silent handling
      }

      try {
        window.dispatchEvent(
          new CustomEvent('ai-project-changed', {
            detail: { projectId: selectedProjectId, sourceIds },
          })
        );
      } catch {
        // Silent handling
      }

      onProjectChange?.(selectedProjectId);
    },
    [selectedProjectId, onProjectChange]
  );

  return {
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
  };
}
