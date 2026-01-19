import { z } from 'zod';

/**
 * Generic API Response Schema
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().nullable(),
  });

/**
 * Generic API Error Schema
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  status: z.number(),
});

/**
 * Pagination Metadata Schema
 */
export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
});

/**
 * Paginated Response Schema
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
    error: z.string().nullable(),
  });

/**
 * Type exports
 */
export type ApiResponse<T> = {
  data: T;
  error: string | null;
};

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
  error: string | null;
};
