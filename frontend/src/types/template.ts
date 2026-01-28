/**
 * Template and Document Structure Types
 * Type definitions for template parsing, design, and rendering
 */

import {
  SectionHeadersFooters,
  StyleDefinition,
  FootnotesEndnotesCollection,
  Chart,
  TextBox,
  Comment,
  RevisionsCollection
} from './template-advanced';

// Document Format Types
export interface DocumentFormat {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  lineSpacing?: number;
  indent?: number;
  spacing?: {
    before?: number;
    after?: number;
  };
}

// Run (inline text style)
export interface TextRun {
  text: string;
  format?: DocumentFormat;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

// Paragraph
export interface DocumentParagraph {
  id?: string;
  name?: string; // Style name
  label?: string; // Display label
  text?: string;
  runs?: TextRun[];
  format?: DocumentFormat;
  style?: string;
  level?: number;
  page?: number;
  order_index?: number;
  index?: number; // Legacy: paragraph index
}

// Table Structure
export interface TableColumn {
  width?: number;
  style?: DocumentFormat;
}

export interface TableCell {
  text?: string;
  runs?: TextRun[];
  format?: DocumentFormat;
  rowSpan?: number;
  colSpan?: number;
  style?: Record<string, unknown>;
  row?: number; // Cell row position
  col?: number; // Cell column position
  images?: DocumentImage[]; // Images within cell
}

export interface TableRow {
  cells: TableCell[];
  format?: DocumentFormat;
  isHeader?: boolean;
}

export interface DocumentTable {
  id?: string;
  name?: string; // Table name
  label?: string; // Display label
  rows: number | TableRow[];
  rows_data?: TableRow[]; // Legacy: alternative property for rows data
  columns?: TableColumn[];
  cells?: TableCell[];
  rowFormats?: DocumentFormat[];
  format?: DocumentFormat;
  style?: Record<string, unknown>;
  page?: number;
  order_index?: number;
  index?: number; // Legacy: table index
  cols?: number; // Number of columns (legacy)
  defaultFontSize?: number | { width: number; height: number }; // Default font size or document size
}

// Image
export interface DocumentImage {
  id?: string;
  url?: string;
  src?: string;
  width?: number;
  height?: number;
  caption?: string;
  alt?: string;
  page?: number;
  order_index?: number;
  format?: DocumentFormat; // Image format settings
}

// Section Break
export interface DocumentSection {
  id?: string;
  title?: string;
  level?: number;
  page?: number;
  order_index?: number;
  // Page settings
  page_width?: number;
  page_height?: number;
  margin_top?: number;
  margin_bottom?: number;
  margin_left?: number;
  margin_right?: number;
}

// Page Break
export interface PageBreak {
  page: number;
  order_index?: number;
  type?: string; // Legacy: break type
  paragraphIndex?: number; // Legacy: paragraph index where break occurs
}

// Complete Template Structure
export interface Template {
  id: string;
  name: string;
  description?: string;
  folder_id?: string;
  category?: string; // Template category
  file_path?: string; // File path for uploaded templates
  structure?: TemplateStructure;
  styles?: DocumentFormat[];
  paragraphs?: DocumentParagraph[];
  parsed_tables?: DocumentTable[];
  sections?: DocumentSection[];
  page_breaks?: PageBreak[];
  parsed_images?: DocumentImage[];
  parsed_fields?: DocumentParagraph[]; // Alias for paragraphs
  design_config?: DesignConfig;
  doc_default_size?: { width: number; height: number }; // Default document size
  engine?: string; // Parsing engine used
  template_version?: string; // Template version
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  // Advanced parsing features (v2)
  headers_footers?: SectionHeadersFooters[];
  styles_definitions?: StyleDefinition[];
  footnotes_endnotes?: FootnotesEndnotesCollection;
  charts?: Chart[];
  text_boxes?: TextBox[];
  comments?: Comment[];
  revisions?: RevisionsCollection;
  // Semantic marking system
  semantic_mappings?: SemanticMapping[]; // 語義標記陣列
}

// Template Structure (for hierarchical content)
export interface TemplateStructure {
  sections?: TemplateStructureSection[];
  metadata?: {
    total_pages?: number;
    total_sections?: number;
    document_type?: string;
  };
}

export interface TemplateStructureSection {
  title: string;
  level: number;
  page?: number;
  order_index: number;
  children?: TemplateStructureSection[];
}

// Design Configuration
export interface DesignConfig {
  pageSize?: {
    width: number;
    height: number;
  };
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  defaultFont?: {
    family: string;
    size: number;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  styles?: Record<string, DocumentFormat>;
}

// Component for Template Designer
export interface TemplateComponent {
  id: string;
  type: 'paragraph' | 'table' | 'image' | 'section' | 'pageBreak';
  data: DocumentParagraph | DocumentTable | DocumentImage | DocumentSection | PageBreak;
  page?: number;
  order_index?: number;
  sortIndex?: number; // Used for sorting components in legacy mode
}

// Props for Template Components
export interface EditableParagraphProps {
  paragraph: DocumentParagraph;
  isSelected: boolean;
  onClick: () => void;
}

export interface EditableTableProps {
  table: DocumentTable;
  isSelected: boolean;
  onClick: () => void;
}

export interface PropertyPanelProps {
  component: TemplateComponent | null;
  template: Template;
  onUpdate: (updates: Partial<Template>) => void;
}

// Template Folder
export interface TemplateFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  user_id?: string;
  created_at?: string;
}

// Template Upload Mode
export type TemplateUploadMode = 'replace' | 'merge' | 'new';

// ==================== Semantic Marking System ====================

// 語義角色類型定義
export type SemanticRole =
  | 'heading1'      // 主標題
  | 'heading2'      // 次標題
  | 'heading3'      // 三級標題
  | 'content'       // 一般內文
  | 'list'          // 列表項目
  | 'quote'         // 引用文字
  | 'caption'       // 圖說/表格標題
  | 'emphasis'      // 強調文字
  | 'note'          // 備註說明
  | 'footer'        // 頁尾文字
  | 'custom';       // 自訂角色

// 語義標記
export interface SemanticMapping {
  id: string;                    // 唯一標識
  paragraph_index: number;       // 段落索引（對應 paragraphs 陣列）
  semantic_role: SemanticRole;   // 語義角色
  label: string;                 // 顯示標籤（例如：「專案標題」）
  ai_placeholder?: string;       // AI 佔位符（例如：「{project_title}」）
  description?: string;          // 描述說明
  is_required?: boolean;         // 是否為必填
  metadata?: Record<string, unknown>; // 額外資訊
}

// 語義角色顯示資訊
export interface SemanticRoleInfo {
  role: SemanticRole;
  label: string;
  description: string;
  icon: string;
  color: string;
}

// 語義角色選項清單
export const SEMANTIC_ROLES: SemanticRoleInfo[] = [
  {
    role: 'heading1',
    label: '主標題',
    description: '文檔的主要標題（H1）',
    icon: '📌',
    color: '#FA4028'
  },
  {
    role: 'heading2',
    label: '次標題',
    description: '章節的次要標題（H2）',
    icon: '📍',
    color: '#FF6B4A'
  },
  {
    role: 'heading3',
    label: '三級標題',
    description: '小節的標題（H3）',
    icon: '📎',
    color: '#FF9166'
  },
  {
    role: 'content',
    label: '一般內文',
    description: '標準段落文字',
    icon: '📄',
    color: '#4A5568'
  },
  {
    role: 'list',
    label: '列表項目',
    description: '清單或列舉項目',
    icon: '📋',
    color: '#3182CE'
  },
  {
    role: 'quote',
    label: '引用文字',
    description: '引用或參考內容',
    icon: '💬',
    color: '#805AD5'
  },
  {
    role: 'caption',
    label: '圖說/表格標題',
    description: '圖片或表格的說明文字',
    icon: '🖼️',
    color: '#38A169'
  },
  {
    role: 'emphasis',
    label: '強調文字',
    description: '需要突出顯示的內容',
    icon: '⭐',
    color: '#D69E2E'
  },
  {
    role: 'note',
    label: '備註說明',
    description: '附加說明或注意事項',
    icon: '📝',
    color: '#667EEA'
  },
  {
    role: 'footer',
    label: '頁尾文字',
    description: '頁面底部的資訊',
    icon: '⬇️',
    color: '#718096'
  },
  {
    role: 'custom',
    label: '自訂角色',
    description: '使用者自定義的特殊角色',
    icon: '🔧',
    color: '#A0AEC0'
  }
];
