/**
 * Type-safe Templates API Client
 */

import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Zod schemas
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  folder_id: z.string().nullable(),
  structure: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ParseTemplateResultSchema = z.object({
  structure: z.record(z.string(), z.unknown()),
  metadata: z.object({
    title: z.string().optional(),
    sections: z.number().optional(),
    wordCount: z.number().optional(),
  }).optional(),
});

// Types
export type Template = z.infer<typeof TemplateSchema>;
export type ParseTemplateResult = z.infer<typeof ParseTemplateResultSchema>;

/**
 * Templates API client
 */
export const templatesApi = {
  /**
   * Parse a template file
   */
  async parse(file: File): Promise<ParseTemplateResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/templates/parse', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to parse template: ${response.statusText}`);
    }

    const data = await response.json();
    return ParseTemplateResultSchema.parse(data);
  },

  /**
   * Update existing template
   */
  async update(id: string, updates: Partial<Template>): Promise<Template> {
    const { data } = await apiClient.post<Template>('/api/templates/update', {
      id,
      ...updates,
    });
    return TemplateSchema.parse(data);
  },

  /**
   * Save template as new copy
   */
  async saveAs(templateId: string, newData: {
    name: string;
    description?: string;
    category?: string;
    folder_id?: string;
  }): Promise<any> {
    const { data } = await apiClient.post('/api/templates/save-as', {
      template_id: templateId,
      ...newData,
    });
    return data;
  },

  /**
   * Trigger background parsing of an uploaded template
   */
  async triggerParse(templateId: string, filePath: string): Promise<void> {
    await fetch('/api/templates/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        file_path: filePath,
      }),
    });
  },
};
