/**
 * Type-safe Sources API Client
 */

import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Zod schemas for validation
export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  origin_url: z.string().nullable(),
  type: z.string(),
  status: z.enum(['processing', 'active', 'failed', 'archived']),
  project_id: z.string(),
  source_type: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  content: z.string().nullable(),
});

export const CreateSourceSchema = z.object({
  title: z.string(),
  origin_url: z.string(),
  type: z.string(),
  status: z.string(),
  project_id: z.string(),
  source_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const AISearchResultSchema = z.object({
  sources: z.array(SourceSchema),
  answer: z.string(),
  citations: z.array(z.string()),
});

export const SummarizeResultSchema = z.object({
  summary: z.string(),
  source_id: z.string(),
  topics: z.array(z.string()).optional(),
});

// Types
export type Source = z.infer<typeof SourceSchema>;
export type CreateSourceInput = z.infer<typeof CreateSourceSchema>;
export type AISearchResult = z.infer<typeof AISearchResultSchema>;
export type SummarizeResult = z.infer<typeof SummarizeResultSchema>;

/**
 * Sources API client
 */
export const sourcesApi = {
  /**
   * Get all sources for a project
   */
  async getAll(projectId?: string): Promise<Source[]> {
    // TODO: Implement backend endpoint /api/sources/list or /api/sources
    // For now, return empty array - sources are queried via Supabase in components
    return [];
  },

  /**
   * Create a new source
   */
  async create(input: CreateSourceInput): Promise<Source> {
    const { data } = await apiClient.post<Source>('/api/sources/create', input);
    return SourceSchema.parse(data);
  },

  /**
   * Create source from URL
   */
  async fromUrl(url: string, projectId: string): Promise<Source> {
    const { data } = await apiClient.post<Source>('/api/sources/from-url', {
      url,
      project_id: projectId,
    });
    return SourceSchema.parse(data);
  },

  /**
   * Create source from text
   */
  async fromText(
    title: string,
    content: string,
    projectId: string
  ): Promise<Source> {
    const { data } = await apiClient.post<Source>('/api/sources/from-text', {
      title,
      content,
      project_id: projectId,
    });
    return SourceSchema.parse(data);
  },

  /**
   * AI-powered search across sources
   */
  async aiSearch(
    query: string,
    projectId: string,
    limit?: number
  ): Promise<AISearchResult> {
    const { data } = await apiClient.post<AISearchResult>('/api/sources/ai-search', {
      query,
      project_id: projectId,
      limit,
    });
    return AISearchResultSchema.parse(data);
  },

  /**
   * Summarize a source
   */
  async summarize(sourceId: string): Promise<SummarizeResult> {
    const { data } = await apiClient.post<SummarizeResult>('/api/sources/summarize', {
      source_id: sourceId,
    });
    return SummarizeResultSchema.parse(data);
  },
};
