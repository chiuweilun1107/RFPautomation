/**
 * Projects Feature Module
 * Public API exports
 */

// Components
export { ProjectListContainer } from './components/ProjectListContainer';
export { ProjectCard } from './components/ProjectCard';
export { ProjectGrid } from './components/ProjectGrid';
export { ProjectToolbar } from './components/ProjectToolbar';
export { ProjectPagination } from './components/ProjectPagination';
export { ProjectEmptyState } from './components/ProjectEmptyState';

// Hooks
export { useProjects } from './hooks/useProjects';
export { useProjectFilters } from './hooks/useProjectFilters';
export type { Project } from './hooks/useProjects';

// Types
export type { ProjectStatus, ProjectCreateInput, ProjectUpdateInput } from './types/project.schema';

// API
export { projectsApi } from './api/projectsApi';
