ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS paragraphs JSONB DEFAULT '[]'::jsonb;
