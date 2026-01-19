/**
 * Content and Document Types
 * Type definitions for document content, pages, and metadata
 */

// Page Content
export interface PageContent {
  page: number;
  content: string;
  tokens?: number;
  tables?: TableData[];
  images?: ImageData[];
  metadata?: PageMetadata;
}

export interface PageMetadata {
  width?: number;
  height?: number;
  orientation?: 'portrait' | 'landscape';
  hasHeader?: boolean;
  hasFooter?: boolean;
}

// Table Data (from parsed documents)
export interface TableData {
  rows: string[][];
  headers?: string[];
  caption?: string;
  page?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Image Data (from parsed documents)
export interface ImageData {
  url?: string;
  base64?: string;
  width?: number;
  height?: number;
  caption?: string;
  alt?: string;
  page?: number;
  position?: {
    x: number;
    y: number;
  };
}

// Source with Pages
export interface SourceWithPages {
  id: string;
  title: string;
  source_type?: 'pdf' | 'url' | 'text' | 'docx';
  pages?: PageContent[];
  content?: string;
  summary?: string;
  topics?: string[];
  images?: ImageData[];
  metadata?: SourceMetadata;
  created_at?: string;
}

export interface SourceMetadata {
  total_pages?: number;
  file_size?: number;
  mime_type?: string;
  author?: string;
  created_date?: string;
  modified_date?: string;
  [key: string]: unknown;
}

// Highlight Text
export interface HighlightText {
  text: string;
  page?: number;
  position?: {
    start: number;
    end: number;
  };
}

// Citation with Source Info
export interface Citation {
  id?: string | number;
  source_id: string;
  page?: number;
  quote?: string;
  source_title?: string;
  title?: string;
  sourceType?: 'tender' | 'doc' | 'url' | 'external';
}

// Evidence (for rendering citations)
export interface Evidence {
  id: string | number;
  source_id: string;
  page?: number;
  quote: string;
  source_title: string;
  sourceType: 'tender' | 'doc' | 'url' | 'external';
  title?: string;
}

// Parsed Content Structure
export interface ParsedContent {
  paragraphs?: string[];
  sections?: ContentSection[];
  tables?: TableData[];
  images?: ImageData[];
  metadata?: {
    title?: string;
    author?: string;
    pages?: number;
    word_count?: number;
  };
}

export interface ContentSection {
  title: string;
  content: string;
  level: number;
  page?: number;
  children?: ContentSection[];
}

// AI Search Result
export interface AISearchResult {
  id: string;
  title: string;
  snippet: string;
  url?: string;
  source?: string;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

// Assessment Content Structure
export interface AssessmentContent {
  type?: 'paragraph' | 'list' | 'table';
  text?: string;
  items?: AssessmentContent[];
  citations?: Citation[];
}

// Content with Citations
export interface ContentWithCitations {
  text: string;
  citations: Citation[];
  formatted?: string; // HTML or markdown formatted content
}

// Clean Page Content Function Return Type
export interface CleanedPageContent {
  content: string;
  hasContent: boolean;
  wordCount: number;
}
