import { z } from 'zod';

/**
 * Source Type Enum
 */
export const SourceTypeSchema = z.enum([
  'pdf',
  'docx',
  'url',
  'text',
  'markdown',
]);

/**
 * Knowledge Source Schema
 */
export const KnowledgeSourceSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  type: SourceTypeSchema,
  url: z.string().url().nullable(),
  file_path: z.string().nullable(),
  content: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Knowledge Item Schema (for search results)
 */
export const KnowledgeItemSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

/**
 * Knowledge Search Request Schema
 */
export const KnowledgeSearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  project_id: z.string().uuid(),
  limit: z.number().min(1).max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
});

/**
 * Knowledge Search Response Schema
 */
export const KnowledgeSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      item: KnowledgeItemSchema,
      source: KnowledgeSourceSchema,
      similarity: z.number(),
    })
  ),
  error: z.string().nullable(),
});

/**
 * Type exports
 */
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;
export type KnowledgeSearchRequest = z.infer<typeof KnowledgeSearchRequestSchema>;
export type KnowledgeSearchResponse = z.infer<typeof KnowledgeSearchResponseSchema>;
