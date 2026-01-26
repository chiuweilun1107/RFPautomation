import { Evidence } from '@/components/workspace/CitationBadge';
import { Source } from '@/features/sources/api/sourcesApi';
import { Project } from '@/features/projects/types/project.schema';
import { ChatMessage } from '@/types/api';

/**
 * Mock data factories for testing
 */

interface MockSourceOverrides {
  id?: string;
  title?: string;
  summary?: string;
  content?: string;
  source_type?: string;
  topics?: string[];
  pages?: Array<{ page: number; content: string }>;
}

interface MockProjectOverrides {
  id?: string;
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface MockMessageOverrides {
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  sources?: Evidence[];
}

interface MockApiResponseOverrides {
  ok?: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}

export const mockEvidence = (overrides?: Partial<Evidence>): Evidence => ({
  id: 1,
  source_id: 'source-123',
  page: 1,
  source_title: 'Test Document',
  quote: 'This is a test quote from the document.',
  sourceType: 'external',
  chunk_type: 'text',
  ...overrides,
})

export const mockImageEvidence = (overrides?: Partial<Evidence>): Evidence => ({
  id: 2,
  source_id: 'source-456',
  page: 2,
  source_title: 'Test Image Document',
  quote: 'Image description',
  sourceType: 'image',
  chunk_type: 'image',
  image_url: 'https://example.com/image.png',
  ...overrides,
})

export const mockSource = (overrides?: MockSourceOverrides): Partial<Source> & MockSourceOverrides => ({
  id: 'source-123',
  title: 'Test Document',
  summary: 'This is a test document summary.',
  content: 'Full document content here.',
  source_type: 'external',
  topics: ['testing', 'documentation'],
  pages: [
    { page: 1, content: 'Page 1 content' },
    { page: 2, content: 'Page 2 content' },
  ],
  ...overrides,
})

export const mockProject = (overrides?: MockProjectOverrides): Partial<Project> & MockProjectOverrides => ({
  id: 'project-123',
  name: 'Test Project',
  description: 'A test project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-123',
  ...overrides,
})

export const mockMessage = (overrides?: MockMessageOverrides): ChatMessage & MockMessageOverrides => ({
  role: 'user' as const,
  content: 'Test message',
  sources: [],
  ...overrides,
})

export const mockApiResponse = <TData = unknown>(
  data: TData,
  overrides?: MockApiResponseOverrides
): Response & MockApiResponseOverrides => ({
  ok: true,
  status: 200,
  json: async () => data,
  ...overrides,
} as Response & MockApiResponseOverrides)

export const mockApiError = (message: string, status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
})
