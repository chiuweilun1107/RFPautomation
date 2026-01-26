/**
 * React Query & Mutation Types
 * Strict type definitions for TanStack Query operations
 */

import { Project } from '@/features/projects/types/project.schema';
import { Source } from '@/features/sources/api/sourcesApi';
import { Template } from './template';

// ============================================
// Project Query Types
// ============================================

export interface ProjectsQueryData {
  data: Project[];
  nextPage: number | null;
}

export interface ProjectsInfiniteQueryPage {
  data: Project[];
  nextPage: number | null;
}

export interface ProjectsInfiniteQueryData {
  pages: ProjectsInfiniteQueryPage[];
  pageParams: number[];
}

// ============================================
// Source Query Types
// ============================================

export type SourcesQueryData = Source[];

export interface SourceCreateInput {
  title: string;
  origin_url: string;
  type: string;
  status: string;
  project_id: string;
  source_type?: string;
  tags?: string[];
}

export interface SourceUpdateInput {
  title?: string;
  status?: string;
  tags?: string[];
  content?: string;
}

// ============================================
// Template Query Types
// ============================================

export type TemplatesQueryData = Template[];

export interface TemplateCreateInput {
  name: string;
  description?: string;
  project_id: string;
  folder_id?: string;
  category?: string;
}

export interface TemplateUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  design_config?: Template['design_config'];
  paragraphs?: Template['paragraphs'];
  parsed_tables?: Template['parsed_tables'];
  styles?: Template['styles'];
}

// ============================================
// Generic Query Cache Update Types
// ============================================

export type QueryCacheUpdater<T> = (oldData: T | undefined) => T;

export interface MutationContext {
  previousData?: unknown;
}

export interface OptimisticUpdateContext<T> {
  previousData?: T;
  rollback: () => void;
}
