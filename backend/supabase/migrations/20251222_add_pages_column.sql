-- Add pages column to sources table to store structured page data (JSON)
ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS pages JSONB DEFAULT '[]'::JSONB;

-- Comment on column
COMMENT ON COLUMN public.sources.pages IS 'Structured array of pages: [{page: 1, content: "..."}]';
