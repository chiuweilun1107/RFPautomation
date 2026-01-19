/**
 * Type-safe N8N Workflow API Client
 */

import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Zod schemas
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const ChatResponseSchema = z.object({
  message: z.string(),
  sources: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const DraftResponseSchema = z.object({
  answer: z.string(),
  content: z.string().optional(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).optional(),
});

export const EvaluateResponseSchema = z.object({
  score: z.number(),
  feedback: z.string(),
  suggestions: z.array(z.string()).optional(),
});

export const IngestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  source_id: z.string().optional(),
});

export const ParseResponseSchema = z.object({
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  structure: z.record(z.string(), z.unknown()).optional(),
});

// Types
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type DraftResponse = z.infer<typeof DraftResponseSchema>;
export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;
export type IngestResponse = z.infer<typeof IngestResponseSchema>;
export type ParseResponse = z.infer<typeof ParseResponseSchema>;

/**
 * N8N Workflow API client
 */
export const n8nApi = {
  /**
   * Chat with AI assistant
   */
  async chat(
    messages: ChatMessage[],
    projectId?: string
  ): Promise<ChatResponse> {
    const { data } = await apiClient.post<ChatResponse>('/api/n8n/chat', {
      messages,
      project_id: projectId,
    });
    return ChatResponseSchema.parse(data);
  },

  /**
   * Generate draft content
   */
  async draft(
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<DraftResponse> {
    const { data } = await apiClient.post<DraftResponse>('/api/n8n/draft', {
      prompt,
      context,
    });
    return DraftResponseSchema.parse(data);
  },

  /**
   * Evaluate content quality
   */
  async evaluate(
    content: string,
    criteria?: string[]
  ): Promise<EvaluateResponse> {
    const { data } = await apiClient.post<EvaluateResponse>('/api/n8n/evaluate', {
      content,
      criteria,
    });
    return EvaluateResponseSchema.parse(data);
  },

  /**
   * Trigger project-level evaluation/assessment
   */
  async evaluateProject(projectId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post<{ success: boolean }>('/api/n8n/evaluate', {
      projectId,
    });
    return data;
  },

  /**
   * Ingest document for processing
   */
  async ingest(
    sourceId: string,
    projectId: string
  ): Promise<IngestResponse> {
    const { data } = await apiClient.post<IngestResponse>('/api/n8n/ingest', {
      source_id: sourceId,
      project_id: projectId,
    });
    return IngestResponseSchema.parse(data);
  },

  /**
   * Parse document structure
   */
  async parse(
    sourceId: string,
    extractStructure = false
  ): Promise<ParseResponse> {
    const { data } = await apiClient.post<ParseResponse>('/api/n8n/parse', {
      source_id: sourceId,
      extract_structure: extractStructure,
    });
    return ParseResponseSchema.parse(data);
  },
};
