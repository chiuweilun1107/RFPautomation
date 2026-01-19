import { z } from 'zod';

/**
 * Project Status Enum
 */
export const ProjectStatusSchema = z.enum([
  'processing',
  'active',
  'completed',
  'archived',
]);

/**
 * Project Schema
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  status: ProjectStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  user_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

/**
 * Project List Response Schema
 */
export const ProjectListResponseSchema = z.object({
  data: z.array(ProjectSchema),
  error: z.string().nullable(),
});

/**
 * Project Create Input Schema
 */
export const ProjectCreateInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  folder_id: z.string().uuid().optional(),
});

/**
 * Project Update Input Schema
 */
export const ProjectUpdateInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: ProjectStatusSchema.optional(),
  folder_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Type exports (inferred from schemas)
 */
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
export type ProjectCreateInput = z.infer<typeof ProjectCreateInputSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateInputSchema>;
