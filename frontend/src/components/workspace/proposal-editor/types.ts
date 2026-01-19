/**
 * 提案编辑器的类型定义
 */

export interface Section {
  id: string;
  title: string;
  order_index: number;
  parent_id?: string | null;
  children?: Section[];
  tasks?: Task[];
  citation_source_id?: string | null;
  citation_page?: number | null;
  citation_quote?: string | null;
  content?: string | null;
  last_integrated_at?: string | null;
}

export interface Task {
  id: string;
  requirement_text: string;
  status: string;
  section_id: string;
  assignee?: string;
  citation_source_id?: string | null;
  citation_page?: number | null;
  citation_quote?: string | null;
  citations?: { source_id: string; page: number; quote: string; title?: string }[];
  order_index?: number;
  task_images?: TaskImage[];
}

export interface TaskImage {
  id: string;
  task_id: string;
  image_url: string;
  description?: string;
  created_at?: string;
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

export interface Citation {
  id: string;
  source_id: string;
  task_id: string;
  page: number;
  position: number;
  created_at?: string;
}

export interface Source {
  id: string;
  project_id: string;
  title: string;
  type: "pdf" | "docx" | "web" | "markdown" | "web_crawl";
  status: "processing" | "ready" | "error";
  url?: string;
  content?: string;
  summary?: string;
  pages?: number;
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

export interface ProposalStructureEditorProps {
  projectId: string;
}
