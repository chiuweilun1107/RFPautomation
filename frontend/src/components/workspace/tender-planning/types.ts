/**
 * Type Definitions for Tender Planning Module
 *
 * All TypeScript interfaces and types used in the TenderPlanning component.
 */

/**
 * Main component props for TenderPlanning
 */
export interface TenderPlanningProps {
    /** Project ID for which to manage the tender structure */
    projectId: string;
    /** Callback when user wants to proceed to next stage */
    onNextStage?: () => void;
    /** Callback when user wants to return to previous stage */
    onPrevStage?: () => void;
}

/**
 * Task entity representing a requirement or work item
 */
export interface Task {
    /** Unique task identifier */
    id: string;
    /** Requirement text content (can be string or structured data) */
    requirement_text: string | any;
    /** Task status (pending, approved, etc.) */
    status: string;
    /** Parent section ID this task belongs to */
    section_id: string;
    /** Optional citation source reference */
    citation_source_id?: string;
    /** Optional page number in citation source */
    citation_page?: number;
    /** Optional quote from citation source */
    citation_quote?: string;
    /** Task creation timestamp */
    created_at?: string;
}

/**
 * Section entity representing a sub-section within a chapter
 */
export interface Section {
    /** Unique section identifier */
    id: string;
    /** Section title/name */
    title: string;
    /** Parent chapter ID (null for root chapters) */
    parent_id: string | null;
    /** Order position within parent */
    order_index: number;
    /** How this section was created */
    generation_method?: 'manual' | 'ai_gen' | 'template';
    /** Whether user has manually modified this section */
    is_modified?: boolean;
    /** Tasks belonging to this section */
    tasks?: Task[];
    /** UI state: whether tasks are expanded/visible */
    expanded?: boolean;
}

/**
 * Chapter entity representing a top-level section
 */
export interface Chapter {
    /** Unique chapter identifier */
    id: string;
    /** Chapter title/name */
    title: string;
    /** Child sections within this chapter */
    sections: Section[];
    /** How this chapter was created */
    generation_method?: 'manual' | 'ai_gen' | 'template';
    /** Whether user has manually modified this chapter */
    is_modified?: boolean;
    /** UI state: whether sections are expanded/visible */
    expanded?: boolean;
}

/**
 * Dialog context types
 */
export type DialogContext = 'chapter' | 'section';

/**
 * Generation modes for AI content creation
 */
export type GenerationMode = 'replace_all' | 'append_only';

/**
 * Task generation modes
 */
export type TaskGenerationMode = 'function' | 'content';

/**
 * Task generation context data
 */
export interface TaskGenerationContext {
    /** Section ID to generate tasks for */
    sectionId: string;
    /** Section title for context */
    sectionTitle: string;
    /** Generation mode (function or content) */
    mode: TaskGenerationMode;
}

/**
 * Source selection context for multi-step workflows
 */
export interface SourceSelectionContext {
    /** Type of entity requesting source selection */
    type: 'chapter' | 'section' | 'task';
    /** Additional context data */
    data: any;
    /** Callback to execute after source selection */
    next: (sourceIds: string[]) => void;
}

/**
 * Dialog state management
 */
export interface DialogState {
    /** Method selection dialog (Manual, AI, Template) */
    isMethodDialogOpen: boolean;
    /** Current dialog context (chapter or section) */
    methodDialogContext: DialogContext;
    /** Active chapter index for section operations */
    activeSectionChapterIndex: number | null;
    /** Template upload dialog */
    isTemplateDialogOpen: boolean;
    /** Generation mode selection dialog */
    isGenerationModeDialogOpen: boolean;
    /** Task generation mode dialog */
    isTaskModeDialogOpen: boolean;
    /** Task generation context data */
    taskGenerationContext: TaskGenerationContext | null;
    /** Source selection dialog */
    isSourceSelectionOpen: boolean;
    /** Source selection context data */
    sourceSelectionContext: SourceSelectionContext | null;
}

/**
 * State for tender outline management
 */
export interface TenderState {
    /** Chapter outline structure */
    outline: Chapter[];
    /** Loading state */
    loading: boolean;
    /** Saving state */
    saving: boolean;
    /** AI generation in progress */
    generating: boolean;
    /** IDs of sections to be deleted on next save */
    deletedSectionIds: string[];
    /** Header expansion state */
    isHeaderExpanded: boolean;
}
