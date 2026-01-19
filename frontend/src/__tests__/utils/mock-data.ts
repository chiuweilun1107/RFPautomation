import { Evidence } from '@/components/workspace/CitationBadge'

/**
 * Mock data factories for testing
 */

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

export const mockSource = (overrides?: any) => ({
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

export const mockProject = (overrides?: any) => ({
  id: 'project-123',
  name: 'Test Project',
  description: 'A test project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-123',
  ...overrides,
})

export const mockMessage = (overrides?: any) => ({
  role: 'user' as const,
  content: 'Test message',
  sources: [],
  ...overrides,
})

export const mockApiResponse = (data: any, overrides?: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
  ...overrides,
})

export const mockApiError = (message: string, status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
})
