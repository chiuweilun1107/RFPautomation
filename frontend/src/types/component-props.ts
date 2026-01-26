/**
 * Component Props Types
 * Strict type definitions for component properties
 */

import { Template, DocumentParagraph, DocumentTable } from './template';
import { Source } from '@/features/sources/api/sourcesApi';
import { Project } from '@/features/projects/types/project.schema';

// ============================================
// Template Component Props
// ============================================

export interface PropertyPanelComponentProps {
  component: Template | DocumentParagraph | DocumentTable | null;
  template: Template;
  onComponentUpdate: (updatedComponent: Template | DocumentParagraph | DocumentTable) => void;
}

export interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  onUpdateOriginal: (designConfig: Template['design_config']) => void;
  currentTemplate?: Template;
}

export interface SaveAsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (newTemplate: Partial<Template>) => Promise<void>;
  currentTemplate?: Template;
}

export interface DraggableComponentProps {
  id: string;
  type: 'paragraph' | 'table' | 'image';
  data: DocumentParagraph | DocumentTable | { url: string; alt?: string };
}

export interface EditorCanvasProps {
  template: Template;
  components: Array<DocumentParagraph | DocumentTable>;
  selectedComponent: DocumentParagraph | DocumentTable | null;
  onComponentClick: (component: DocumentParagraph | DocumentTable) => void;
  onSelectComponent: (component: DocumentParagraph | DocumentTable | null) => void;
}

// ============================================
// Workspace Component Props
// ============================================

export interface ProjectWorkspaceLayoutProps {
  project: Project;
  children: React.ReactNode;
}

export interface KnowledgeSidebarProps {
  projectId: string;
  onSelectSource?: (source: Source) => void;
}

export interface RenameSourceDialogProps {
  open: boolean;
  onClose: () => void;
  source: Source | null;
  onRename: (sourceId: string, newTitle: string) => Promise<void>;
}

// ============================================
// OnlyOffice Component Props
// ============================================

export interface OnlyOfficeEditorConfig {
  documentType: 'word' | 'cell' | 'slide';
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions?: {
      download?: boolean;
      edit?: boolean;
      print?: boolean;
      review?: boolean;
    };
  };
  editorConfig: {
    mode?: 'edit' | 'view';
    lang?: string;
    user?: {
      id: string;
      name: string;
    };
    customization?: {
      autosave?: boolean;
      comments?: boolean;
      compactToolbar?: boolean;
      feedback?: boolean;
      forcesave?: boolean;
    };
  };
  events?: {
    onDocumentReady?: () => void;
    onError?: (event: OnlyOfficeErrorEvent) => void;
    onDocumentStateChange?: (event: { data: boolean }) => void;
  };
}

export interface OnlyOfficeErrorEvent {
  data: {
    errorCode: number;
    errorDescription: string;
  };
}

// ============================================
// Drag and Drop Props
// ============================================

export interface DragHandleProps {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown>;
  isDragging: boolean;
}

export interface SortableItemChildrenProps {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown>;
  isDragging: boolean;
}

// ============================================
// Tender/Proposal Props
// ============================================

export interface TenderRequirement {
  id: string;
  label: string;
  value: string;
  checked: boolean;
}

export interface TenderRequirementsProps {
  requirements: TenderRequirement[];
  onToggle: (id: string) => void;
}

export interface CheckItemProps {
  id: string;
  label: string;
  value: string;
  checked: boolean;
  onToggle: (id: string) => void;
}
