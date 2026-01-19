-- Expand source_type constraint to include google_drive
ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_source_type_check;

ALTER TABLE public.sources
ADD CONSTRAINT sources_source_type_check
CHECK (source_type IN (
    'upload',
    'url',
    'search',
    'rfp',
    'tender',
    'internal',
    'external',
    'google_drive'  -- New type for Google Drive imports
));

-- Add comment
COMMENT ON COLUMN public.sources.source_type IS 'Source origin: upload (local), url (web crawl), google_drive (from Google Drive), etc.';
