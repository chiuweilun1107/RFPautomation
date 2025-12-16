-- Add stage column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS stage SMALLINT DEFAULT 0;

COMMENT ON COLUMN public.projects.stage IS 'Project workflow stage: 0=Assessment, 1=Launch, 2=Planning, 3=Writing, 4=Review, 5=Handover';
