import { apiClient } from '@/lib/api-client';
import {
  KnowledgeSourceSchema,
  KnowledgeSearchRequestSchema,
  KnowledgeSearchResponseSchema,
  type KnowledgeSource,
  type KnowledgeSearchRequest,
  type KnowledgeSearchResponse,
} from '../types/knowledge.schema';
import { ApiResponseSchema } from '@/lib/schemas/api.schema';

/**
 * Knowledge Base API Client
 * Type-safe API calls for knowledge management
 */
export const knowledgeApi = {
  /**
   * Get all knowledge sources for a project
   */
  async getByProject(projectId: string): Promise<KnowledgeSource[]> {
    const response = await apiClient.get<{ data: unknown[]; error: string | null }>(
      `/api/knowledge?project_id=${projectId}`
    );

    // Validate response
    const responseSchema = ApiResponseSchema(KnowledgeSourceSchema.array());
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Get a single knowledge source by ID
   */
  async getById(id: string): Promise<KnowledgeSource> {
    const response = await apiClient.get<{ data: unknown; error: string | null }>(
      `/api/knowledge/${id}`
    );

    const responseSchema = ApiResponseSchema(KnowledgeSourceSchema);
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Upload a new knowledge source
   */
  async upload(formData: FormData): Promise<KnowledgeSource> {
    const response = await apiClient.post<{ data: unknown; error: string | null }>(
      '/api/knowledge/upload',
      formData,
      {
        headers: {
          // Let browser set Content-Type for FormData
        },
      }
    );

    const responseSchema = ApiResponseSchema(KnowledgeSourceSchema);
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Add knowledge from URL
   */
  async addFromUrl(projectId: string, url: string, title?: string): Promise<KnowledgeSource> {
    const response = await apiClient.post<{ data: unknown; error: string | null }>(
      '/api/knowledge/url',
      { project_id: projectId, url, title }
    );

    const responseSchema = ApiResponseSchema(KnowledgeSourceSchema);
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Delete a knowledge source
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<{ error: string | null }>(
      `/api/knowledge/${id}`
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }
  },

  /**
   * Search knowledge base
   */
  async search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResponse> {
    // Validate input
    const validatedRequest = KnowledgeSearchRequestSchema.parse(request);

    const response = await apiClient.post<unknown>(
      '/api/knowledge/search',
      validatedRequest
    );

    // Validate response
    const validated = KnowledgeSearchResponseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated;
  },
};
