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
    citation_source_id?: string | null;
    citation_page?: number | null;
    citation_quote?: string | null;
    content?: string | null;
    last_integrated_at?: string | null;
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
    status?: string;
    url?: string;
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
