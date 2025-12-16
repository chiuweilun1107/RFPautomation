-- Reset Schema first (Drop everything to be safe)
drop table if exists chunks cascade;
drop table if exists criteria cascade;
drop table if exists knowledge_docs cascade;
drop table if exists project_sources cascade;
drop table if exists sources cascade;
drop table if exists tasks cascade;
drop table if exists sections cascade;
drop table if exists projects cascade;

-- Enable pgvector extension for RAG
create extension if not exists vector with schema extensions;

-- Projects Table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid references auth.users(id) on delete set null,
  status text check (status in ('draft', 'processing', 'active', 'completed')) default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Sources Table (Knowledge Base Items)
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade, -- Nullable for global sources
  type text check (type in ('markdown', 'pdf', 'docx', 'web_crawl')),
  title text not null,
  origin_url text, -- Storage path or Web URL
  status text check (status in ('processing', 'ready', 'error')) default 'processing',
  created_at timestamp with time zone default now()
);

-- Chunks Table (Vector Store)
create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete cascade,
  content text not null,
  embedding vector(768), -- Google Gemini text-embedding-004
  metadata jsonb default '{}'::jsonb, -- { page: 1, section: "2.1" }
  created_at timestamp with time zone default now()
);

-- Criteria Table (Grading Rules)
create table public.criteria (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  group_name text, -- "技術能力", "價格"
  title text not null,
  weight float default 0,
  description text,
  created_at timestamp with time zone default now()
);

-- Sections Table (Outline)
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  parent_id uuid references public.sections(id) on delete cascade,
  title text not null,
  content_draft text, -- HTML with citations
  criteria_ids uuid[], -- Array of criteria UUIDs
  order_index int default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.criteria enable row level security;
alter table public.sections enable row level security;

-- Dev Policies (Allow All)
create policy "Allow all" on public.projects for all using (true);
create policy "Allow all" on public.sources for all using (true);
create policy "Allow all" on public.chunks for all using (true);
create policy "Allow all" on public.criteria for all using (true);
create policy "Allow all" on public.sections for all using (true);

-- Indexes
create index idx_chunks_source on public.chunks(source_id);
create index idx_criteria_project on public.criteria(project_id);
create index idx_chunks_embedding on public.chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Vector Search Function
create or replace function match_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_project_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float,
  source_title text
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    s.title as source_title
  from chunks c
  join sources s on c.source_id = s.id
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  and (
    s.project_id = filter_project_id 
    or s.project_id is null -- Include global sources
  )
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
