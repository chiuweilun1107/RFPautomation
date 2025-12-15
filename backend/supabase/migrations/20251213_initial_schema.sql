-- Enable pgvector extension for RAG
create extension if not exists vector with schema extensions;

-- Projects Table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid references auth.users(id) on delete set null,
  original_file_url text,
  status text check (status in ('draft', 'processing', 'active', 'completed')) default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Sections Table (Hierarchical)
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  parent_id uuid references public.sections(id) on delete cascade,
  type text check (type in ('chapter', 'table_row', 'requirement')),
  content text,
  order_index int default 0,
  created_at timestamp with time zone default now()
);

-- Tasks Table (Atomic Requirements)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references public.sections(id) on delete cascade,
  requirement_text text,
  response_draft text,
  response_final text,
  assigned_to uuid references auth.users(id) on delete set null,
  status text check (status in ('pending', 'drafted', 'reviewing', 'approved', 'locked')) default 'pending',
  lock_token text,
  ai_confidence float,
  generated_mode text check (generated_mode in ('rag', 'creative')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Knowledge Docs Table (RAG Source)
create table public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  content text,
  source_filename text,
  tags text[],
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  is_archived_answer boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.sections enable row level security;
alter table public.tasks enable row level security;
alter table public.knowledge_docs enable row level security;

-- Create basic policies (Allow authenticated users to do everything for now - dev mode)
-- In production, this should be stricter based on owner_id
create policy "Enable all access for authenticated users" on public.projects for all to authenticated using (true);
create policy "Enable all access for authenticated users" on public.sections for all to authenticated using (true);
create policy "Enable all access for authenticated users" on public.tasks for all to authenticated using (true);
create policy "Enable all access for authenticated users" on public.knowledge_docs for all to authenticated using (true);

-- Create Indexes
create index idx_projects_owner on public.projects(owner_id);
create index idx_sections_project on public.sections(project_id);
create index idx_sections_parent on public.sections(parent_id);
create index idx_tasks_section on public.tasks(section_id);
create index idx_knowledge_embedding on public.knowledge_docs using ivfflat (embedding vector_cosine_ops) with (lists = 100);
