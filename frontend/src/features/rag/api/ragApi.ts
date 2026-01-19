/**
 * Type-safe RAG (Retrieval-Augmented Generation) API Client
 */

import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Zod schemas
export const RAGGenerateInputSchema = z.object({
  prompt: z.string().optional(),
  project_id: z.string(),
  section_id: z.string().optional(),
  section_title: z.string().optional(),
  context_sources: z.array(z.string()).optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
});

export const RAGGenerateResponseSchema = z.object({
  content: z.string(),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    relevance: z.number().optional(),
  })),
  metadata: z.object({
    tokens_used: z.number().optional(),
    model: z.string().optional(),
  }).optional(),
});

// Types
export type RAGGenerateInput = z.infer<typeof RAGGenerateInputSchema>;
export type RAGGenerateResponse = z.infer<typeof RAGGenerateResponseSchema>;

/**
 * RAG API client
 */
export const ragApi = {
  /**
   * Generate content using RAG
   */
  async generate(input: RAGGenerateInput): Promise<RAGGenerateResponse> {
    const validatedInput = RAGGenerateInputSchema.parse(input);
    const { data } = await apiClient.post<RAGGenerateResponse>(
      '/api/rag/generate',
      validatedInput
    );
    return RAGGenerateResponseSchema.parse(data);
  },

  /**
   * Generate with streaming (returns ReadableStream)
   */
  async generateStream(input: RAGGenerateInput): Promise<ReadableStream> {
    const validatedInput = RAGGenerateInputSchema.parse(input);
    
    const response = await fetch('/api/rag/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validatedInput, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`RAG generation failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body;
  },
};
