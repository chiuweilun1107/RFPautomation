/**
 * 提案编辑器的类型定义
 */

export interface Citation {
  source_id: string;
  page: number;
  quote?: string;
  title?: string;
}

export interface Section {
  id: string;
  project_id?: string;
  title: string;
  order_index: number;
  parent_id?: string | null;
  children?: Section[];
  tasks?: Task[];
  citation_source_id?: string | null;
  citation_page?: number | null;
  citation_quote?: string | null;
  citations: Citation[];
  content?: string | null;
  last_integrated_at?: string | null;
  generation_method?: 'manual' | 'wf11_functional' | 'wf13_article' | string;
  is_modified?: boolean;
}

export interface Task {
  id: string;
  project_id?: string;
  title?: string;
  requirement_text: string;
  status: string;
  section_id: string;
  assignee?: string;
  citation_source_id?: string | null;
  citation_page?: number | null;
  citation_quote?: string | null;
  citations: Citation[];
  order_index?: number;
  task_images?: TaskImage[];
  workflow_type?: string;
  created_at?: string;
  is_modified?: boolean;
}

export interface TaskImage {
  id: string;
  task_id: string;
  image_type: 'flowchart' | 'architecture' | 'hero' | 'infographic' | 'ui_concept' | 'custom';
  prompt: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface TaskContent {
  id: string;
  task_id: string;
  content: string;
  content_html?: string;
  citations?: Citation[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskCitation {
  id: string;
  source_id: string;
  task_id: string;
  page: number;
  position: number;
  created_at?: string;
}

export interface Source {
  id: string;
  project_id?: string;
  title: string;
  type?: "pdf" | "docx" | "web" | "markdown" | "web_crawl";
  source_type?: string;
  status?: "processing" | "ready" | "error";
  url?: string;
  origin_url?: string;
  content?: string;
  summary?: string;
  pages?: number;
  topics?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Evidence {
  id: string;
  sourceId: string;
  page?: number;
  content: string;
  position?: number;
}

export interface GenerationProgress {
  current: number;
  total: number;
  message?: string;
}

export interface TaskConflictContext {
  type: "all" | "single";
  targetSection?: Section;
  sourceIds: string[];
  userDesc?: string;
  workflowType?: "technical" | "management";
}

export interface ContentGenerationContext {
  task: Task;
  section: Section;
  sourceIds: string[];
}

export interface SectionUpdatePayload {
  id: string;
  project_id: string;
  title: string;
  parent_id?: string | null;
  order_index: number;
}

export interface ImageGenerationOptions {
  type: string;
  customPrompt?: string;
  referenceImage?: string; // base64
}

export interface DialogState {
  isAddSectionOpen: boolean;
  isAddSubsectionOpen: boolean;
  isGenerateSubsectionOpen: boolean;
  isSubsectionConflictDialogOpen: boolean;
  isAddTaskOpen: boolean;
  isConflictDialogOpen: boolean;
  isContentConflictDialogOpen: boolean;
  isTemplateDialogOpen: boolean;
  isContentGenerationDialogOpen: boolean;
  isAddSourceDialogOpen: boolean;
  imageGenDialogOpen: boolean;
}

export interface FloatingContentPanelsProps {
  openContentPanels: Map<string, { taskText: string; sectionTitle: string }>;
  taskContents: Map<string, any>;
  onClose: (taskId: string) => void;
}

export interface ProposalHeaderProps {
  generating: boolean;
  onGenerate: () => void;
  onAddSection: () => void;
  generationProgress?: GenerationProgress;
  totalSections?: number;
  completedSections?: number;
}

export interface ProposalTreeProps {
  sections: Section[];
  loading: boolean;
  expandedSections: Set<string>;
  sensors?: any; // ReturnType<typeof useSensors>
  onDragEnd?: (event: any) => void;
  renderSection?: (section: Section, depth?: number, dragHandleProps?: any) => React.ReactNode;
  onAddSection?: (parentId?: string) => void;
  onToggleExpand?: (sectionId: string) => void;
}

export interface ProposalStructureEditorProps {
  projectId: string;
}
