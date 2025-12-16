-- Migration: support for Smart Parsing (Evaluation Criteria & Section Mapping)

-- 1. Create Evaluation Criteria Table
create table public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,          -- e.g. "計畫可行性"
  weight integer default 0,    -- e.g. 30 (percent)
  description text,            -- e.g. "請詳述本計畫之..."
  created_at timestamp with time zone default now()
);

-- 2. Update Sections Table
-- Add reference to criteria (This section was auto-generated from this criteria)
alter table public.sections 
add column criteria_id uuid references public.evaluation_criteria(id) on delete set null;

-- 3. Update Tasks Table
-- Add reference to criteria (This task/draft is addressing this criteria)
alter table public.tasks 
add column criteria_id uuid references public.evaluation_criteria(id) on delete set null;

-- 4. Enable RLS for new table
alter table public.evaluation_criteria enable row level security;

-- 5. Create Policy for new table
create policy "Enable all access for authenticated users" on public.evaluation_criteria for all to authenticated using (true);

-- 6. Create Indexes
create index idx_criteria_project on public.evaluation_criteria(project_id);
create index idx_sections_criteria on public.sections(criteria_id);
