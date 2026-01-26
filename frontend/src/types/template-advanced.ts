/**
 * Advanced Template Types
 * Extended type definitions for advanced template features
 */

import { DocumentParagraph, DocumentImage, DocumentTable } from './template';

// ============================================
// Header & Footer Types
// ============================================

export interface HeaderFooterContent {
  paragraphs?: DocumentParagraph[];
  images?: DocumentImage[];
  tables?: DocumentTable[];
}

export interface FooterContent {
  paragraphs?: DocumentParagraph[];
  tables?: DocumentTable[];
}

export interface SectionHeadersFooters {
  section_index: number;
  headers?: {
    default?: HeaderFooterContent;
    first_page?: HeaderFooterContent;
    even_page?: HeaderFooterContent;
  };
  footers?: {
    default?: FooterContent;
    first_page?: FooterContent;
    even_page?: FooterContent;
  };
}

// ============================================
// Style Definition Types
// ============================================

export interface StyleDefinition {
  id: string;
  name: string;
  type: 'paragraph' | 'character' | 'table' | 'numbering';
  based_on?: string;
  next_style?: string;
  font_family?: string;
  font_size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  line_spacing?: number;
  spacing_before?: number;
  spacing_after?: number;
  indent_left?: number;
  indent_right?: number;
  indent_first_line?: number;
}

// ============================================
// Footnotes & Endnotes Types
// ============================================

export interface FootnoteEndnote {
  id: string;
  type: 'footnote' | 'endnote';
  reference_mark: string;
  content: DocumentParagraph[];
  position?: {
    paragraph_index: number;
    character_offset: number;
  };
}

export interface FootnotesEndnotesCollection {
  footnotes: FootnoteEndnote[];
  endnotes: FootnoteEndnote[];
  separator_style?: StyleDefinition;
  continuation_separator_style?: StyleDefinition;
}

// ============================================
// Chart Types
// ============================================

export interface ChartDataSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface ChartData {
  categories: string[];
  series: ChartDataSeries[];
}

export interface Chart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  title?: string;
  data: ChartData;
  width?: number;
  height?: number;
  position?: {
    page: number;
    x: number;
    y: number;
  };
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
}

// ============================================
// Text Box Types
// ============================================

export interface TextBox {
  id: string;
  content: DocumentParagraph[];
  width?: number;
  height?: number;
  position?: {
    page: number;
    x: number;
    y: number;
  };
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  fill?: {
    color: string;
    opacity: number;
  };
  z_index?: number;
}

// ============================================
// Comment & Revision Types
// ============================================

export interface Comment {
  id: string;
  author: string;
  date: string;
  text: string;
  position?: {
    paragraph_index: number;
    character_start: number;
    character_end: number;
  };
  replies?: Comment[];
  resolved?: boolean;
}

export interface Revision {
  id: string;
  type: 'insert' | 'delete' | 'format';
  author: string;
  date: string;
  content?: string;
  position?: {
    paragraph_index: number;
    character_start: number;
    character_end: number;
  };
}

export interface RevisionsCollection {
  revisions: Revision[];
  track_changes_enabled: boolean;
  show_markup: boolean;
}
