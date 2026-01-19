import { z } from 'zod';

/**
 * Proposal Section Schema
 */
export const ProposalSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  order: z.number(),
  parent_id: z.string().nullable(),
});

/**
 * Assessment Item Schema
 */
export const AssessmentItemSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  criterion: z.string(),
  score: z.number().min(0).max(100),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Workspace Data Schema
 */
export const WorkspaceDataSchema = z.object({
  project_id: z.string().uuid(),
  proposal_sections: z.array(ProposalSectionSchema),
  assessments: z.array(AssessmentItemSchema),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

/**
 * Assessment Response Schema
 */
export const AssessmentResponseSchema = z.object({
  data: z.array(AssessmentItemSchema),
  error: z.string().nullable(),
});

/**
 * Type exports
 */
export type ProposalSection = z.infer<typeof ProposalSectionSchema>;
export type AssessmentItem = z.infer<typeof AssessmentItemSchema>;
export type WorkspaceData = z.infer<typeof WorkspaceDataSchema>;
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;
