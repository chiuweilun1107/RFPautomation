export interface Citation {
    source_id: string;
    page: number;
    quote?: string;
    title?: string;
}

export interface Task {
    id: string;
    title?: string;
    requirement_text: string;
    status: string;
    section_id: string;
    assignee?: string;

    // Unified citations JSONB array (no more flat fields)
    citations: Citation[];

    order_index?: number;
    task_images?: TaskImage[];
    workflow_type?: string;
    created_at?: string;
    is_modified?: boolean;
}

export interface TaskContent {
    id: string;
    task_id: string;
    content: string;
    version: number;
    status: string;
    word_count?: number;
    image_description?: string;
    created_at: string;
}

export interface Section {
    id: string;
    title: string;
    order_index: number;
    parent_id?: string | null;
    children?: Section[];
    tasks?: Task[];

    // Unified citations JSONB array (no more flat fields)
    citations: Citation[];

    content?: string | null;
    last_integrated_at?: string | null;
    generation_method?: 'manual' | 'wf11_functional' | 'wf13_article' | string;
    is_modified?: boolean;
}

export interface Source {
    id: string;
    title: string;
    type?: "pdf" | "docx" | "web" | "markdown" | "web_crawl";
    source_type?: string;
    origin_url?: string;
    content?: string;
    created_at?: string;
    summary?: string;
    topics?: string[];
    project_id?: string;
    status?: "processing" | "ready" | "error";
    url?: string;
    pages?: number;
    updated_at?: string;
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
