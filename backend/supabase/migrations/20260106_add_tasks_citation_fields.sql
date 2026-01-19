-- Add citation fields to tasks table for source reference tracking
-- This enables task generation to include references to source documents

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS citation_source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS citation_page integer,
ADD COLUMN IF NOT EXISTS citation_quote text,
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_citation_source ON public.tasks(citation_source_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.citation_source_id IS 'Reference to the source document that supports this task';
COMMENT ON COLUMN public.tasks.citation_page IS 'Page number in the source document';
COMMENT ON COLUMN public.tasks.citation_quote IS 'Quoted text from the source document';
COMMENT ON COLUMN public.tasks.project_id IS 'Direct reference to project for easier querying';
