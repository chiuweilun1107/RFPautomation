import { apiClient } from '@/lib/api-client';
import {
  ProjectSchema,
  ProjectListResponseSchema,
  ProjectCreateInputSchema,
  ProjectUpdateInputSchema,
  type Project,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '../types/project.schema';
import { ApiResponseSchema } from '@/lib/schemas/api.schema';

/**
 * Projects API Client
 * Type-safe API calls for project management
 */
export const projectsApi = {
  /**
   * Get all projects for the current user
   */
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<{ data: unknown[]; error: string | null }>(
      '/api/projects'
    );

    // Validate response with Zod
    const validated = ProjectListResponseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Get a single project by ID
   */
  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<{ data: unknown; error: string | null }>(
      `/api/projects/${id}`
    );

    const responseSchema = ApiResponseSchema(ProjectSchema);
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Create a new project
   */
  async create(input: ProjectCreateInput): Promise<Project> {
    // Validate input
    const validatedInput = ProjectCreateInputSchema.parse(input);

    const response = await apiClient.post<{ data: unknown; error: string | null }>(
      '/api/projects',
      validatedInput
    );

    const responseSchema = ApiResponseSchema(ProjectSchema);
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Update an existing project
   */
  async update(id: string, input: ProjectUpdateInput): Promise<Project> {
    // Validate input
    const validatedInput = ProjectUpdateInputSchema.parse(input);

    const response = await apiClient.patch<{ data: unknown; error: string | null }>(
      `/api/projects/${id}`,
      validatedInput
    );

    const responseSchema = ApiResponseSchema(ProjectSchema);
    const validated = responseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<{ error: string | null }>(
      `/api/projects/${id}`
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }
  },

  /**
   * Archive a project (soft delete)
   */
  async archive(id: string): Promise<Project> {
    return this.update(id, { status: 'archived' });
  },

  /**
   * Search projects by title
   */
  async search(query: string): Promise<Project[]> {
    const response = await apiClient.get<{ data: unknown[]; error: string | null }>(
      `/api/projects/search?q=${encodeURIComponent(query)}`
    );

    const validated = ProjectListResponseSchema.parse(response.data);

    if (validated.error) {
      throw new Error(validated.error);
    }

    return validated.data;
  },
};
