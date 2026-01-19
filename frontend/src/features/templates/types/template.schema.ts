import { z } from 'zod';

/**
 * Template Type Enum
 */
export const TemplateTypeSchema = z.enum([
  'proposal',
  'assessment',
  'document',
  'custom',
]);

/**
 * Template Schema
 */
export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  type: TemplateTypeSchema,
  content: z.string(),
  is_public: z.boolean(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  tags: z.array(z.string()).nullable(),
});

/**
 * Template List Response Schema
 */
export const TemplateListResponseSchema = z.object({
  data: z.array(TemplateSchema),
  error: z.string().nullable(),
});

/**
 * Template Create Input Schema
 */
export const TemplateCreateInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional(),
  type: TemplateTypeSchema,
  content: z.string().min(1, 'Content is required'),
  is_public: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

/**
 * Template Update Input Schema
 */
export const TemplateUpdateInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  type: TemplateTypeSchema.optional(),
  content: z.string().optional(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Type exports
 */
export type TemplateType = z.infer<typeof TemplateTypeSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;
export type TemplateCreateInput = z.infer<typeof TemplateCreateInputSchema>;
export type TemplateUpdateInput = z.infer<typeof TemplateUpdateInputSchema>;
