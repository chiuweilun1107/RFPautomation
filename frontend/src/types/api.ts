/**
 * API Response Types
 * Centralized type definitions for API responses
 */

// Generic API Response
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// Error Response
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// N8N Workflow Response
export interface N8nWorkflowResponse {
  executionId?: string;
  status?: 'success' | 'error' | 'running';
  result?: unknown;
  message?: string;
}

// Chat API Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatStreamResponse {
  delta?: string;
  sources?: SourceReference[];
  done?: boolean;
}

export interface SourceReference {
  id: string;
  title: string;
  source_title?: string;
  page?: number;
  quote?: string;
  type?: 'tender' | 'external' | 'doc';
}

// RAG Generation Response
export interface RagGenerationResponse {
  content: string;
  sources?: SourceReference[];
  metadata?: {
    model_used?: string;
    token_count?: number;
    generation_time?: number;
  };
}

// Document Generation Response
export interface DocumentGenerationResponse {
  documentUrl: string;
  filename: string;
  size?: number;
  generatedAt?: string;
}

// Source API Types
export interface CreateSourceRequest {
  title: string;
  content?: string;
  source_type?: 'pdf' | 'url' | 'text' | 'docx';
  origin_url?: string;
  project_id?: string;
  folder_id?: string;
}

export interface SourceSummaryResponse {
  summary: string;
  topics?: string[];
  key_points?: string[];
}

export interface SourceSearchResult {
  id: string;
  title: string;
  snippet: string;
  relevance_score: number;
  source_type?: string;
  page?: number;
}

// Webhook Response Types
export interface WebhookResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChapterIntegrationResponse {
  section_id: string;
  content: string;
  updated_at: string;
}

export interface ImageGenerationResponse {
  image_url: string;
  prompt: string;
  task_id?: string;
}

export interface ContentGenerationResponse {
  content: string;
  word_count?: number;
  task_id: string;
  citations?: SourceReference[];
}

// Export API Types
export interface ExportRequest {
  project_id: string;
  format: 'docx' | 'pdf';
  sections?: string[];
  include_images?: boolean;
}

// Template API Types
export interface TemplateStructureResponse {
  sections: TemplateSection[];
  metadata?: {
    total_pages?: number;
    total_sections?: number;
  };
}

export interface TemplateSection {
  title: string;
  level: number;
  page?: number;
  order_index: number;
}
