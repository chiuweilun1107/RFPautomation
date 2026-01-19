/**
 * Type definitions for Proposal Structure Editor
 */

// Import and re-export types from parent workspace module
import type { Section as WorkspaceSection, Task as WorkspaceTask, TaskContent as WorkspaceTaskContent, Source as WorkspaceSource } from '../types';
import type { DragEndEvent, DragHandleProps } from '@/types';

export type Section = WorkspaceSection;
export type Task = WorkspaceTask;
export type TaskContent = WorkspaceTaskContent;
export type Source = WorkspaceSource;

// Dialog State Management
export interface DialogState {
  // Section Dialogs
  isAddSectionOpen: boolean;
  isAddSubsectionOpen: boolean;
  isGenerateSubsectionOpen: boolean;
  isSubsectionConflictDialogOpen: boolean;

  // Task Dialogs
  isAddTaskOpen: boolean;

  // Conflict Dialogs
  isConflictDialogOpen: boolean;
  isContentConflictDialogOpen: boolean;

  // Other Dialogs
  isTemplateDialogOpen: boolean;
  isContentGenerationDialogOpen: boolean;
  isAddSourceDialogOpen: boolean;
  imageGenDialogOpen: boolean;
}

// Generation State
export interface GenerationState {
  generating: boolean;
  isGeneratingSubsection: boolean;
  streamingSections: Set<string>;
  progress: { current: number; total: number } | null;
  generatingTaskId: string | null;
  generatingSectionId: string | null;
  integratingSectionId: string | null;
}

// Editing State
export interface EditingState {
  editingSection: Section | null;
  editingTask: Task | null;
  inlineEditingTaskId: string | null;
  inlineTaskValue: string;
  inlineEditingSectionId: string | null;
  inlineSectionValue: string;
}

// Target State (for operations)
export interface TargetState {
  targetSection: Section | null;
  targetSectionId: string | null;
  subsectionTargetSection: Section | null;
  structureWarningSection: Section | null;
}

// Source Selection State
export interface SourceSelectionState {
  selectedSourceIds: string[];
  linkedSourceIds: string[];
  subsectionSourceIds: string[];
  contentGenerationSourceIds: string[];
  showSourceSelector: boolean;
}

// Content Generation State
export interface ContentGenerationState {
  contentGenerationTarget: { task: Task; section: Section } | null;
  pendingContentGeneration: { task: Task; section: Section } | null;
  selectedTaskForImage: Task | null;
}

// Task Conflict Context
export interface TaskConflictContext {
  type: 'all' | 'single';
  targetSection?: Section;
  sourceIds: string[];
  userDesc?: string;
  workflowType?: 'technical' | 'management';
}

// Subsection Generation Args
export interface SubsectionGenerationArgs {
  sourceIds: string[];
  targetSection: Section;
}

// UI State
export interface UIState {
  expandedSections: Set<string>;
  expandedTaskIds: Set<string>;
  expandedCategories: Set<string>;
  sectionViewModes: Record<string, 'tasks' | 'content'>;
  openContentPanels: Map<string, { taskText: string; sectionTitle: string }>;
}

// Props for main component
export interface ProposalStructureEditorProps {
  projectId: string;
}

// Props for sub-components
export interface ProposalHeaderProps {
  generating: boolean;
  onGenerate: () => void;
  onAddSection: () => void;
}

export interface ProposalTreeProps {
  sections: Section[];
  loading: boolean;
  sensors: unknown; // dnd-kit sensors array
  expandedSections: Set<string>;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleExpand: (sectionId: string) => void;
  renderSection: (section: Section, depth: number, dragHandleProps?: DragHandleProps) => React.ReactNode;
}

export interface FloatingContentPanelsProps {
  openContentPanels: Map<string, { taskText: string; sectionTitle: string }>;
  taskContents: Map<string, TaskContent>;
  onClose: (taskId: string) => void;
}

// Operation result types
export interface OperationResult {
  success: boolean;
  error?: string;
}

// Update payload types
export interface SectionUpdatePayload {
  id: string;
  title?: string;
  content?: string;
  order_index?: number;
  parent_id?: string | null;
  project_id?: string;
}

export interface TaskUpdatePayload {
  id: string;
  requirement_text?: string;
  section_id?: string;
  order_index?: number;
  status?: string;
}

// Image Generation Options
export interface ImageGenerationOptions {
  type: 'diagram' | 'illustration' | 'custom';
  customPrompt?: string;
  referenceImage?: string;
}
