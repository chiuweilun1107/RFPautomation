-- Migration: Migrate from flat citation fields to JSONB citations array
-- Date: 2026-01-27
-- Description: Adds citations JSONB field, migrates existing data, and removes flat fields

-- Step 1: Add citations JSONB columns
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::JSONB;

ALTER TABLE public.sections
ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::JSONB;

-- Step 2: Migrate existing flat field data to JSONB array format
-- Migrate tasks table: convert single citation to array format
UPDATE public.tasks
SET citations = jsonb_build_array(
    jsonb_build_object(
        'source_id', citation_source_id::text,
        'page', COALESCE(citation_page, 0),
        'quote', COALESCE(citation_quote, ''),
        'title', COALESCE((SELECT title FROM public.sources WHERE id = citation_source_id LIMIT 1), 'Unknown Source')
    )
)
WHERE citation_source_id IS NOT NULL
  AND (citations IS NULL OR citations = '[]'::JSONB);

-- Migrate sections table: convert single citation to array format
UPDATE public.sections
SET citations = jsonb_build_array(
    jsonb_build_object(
        'source_id', citation_source_id::text,
        'page', COALESCE(citation_page, 0),
        'quote', COALESCE(citation_quote, ''),
        'title', COALESCE((SELECT title FROM public.sources WHERE id = citation_source_id LIMIT 1), 'Unknown Source')
    )
)
WHERE citation_source_id IS NOT NULL
  AND (citations IS NULL OR citations = '[]'::JSONB);

-- Step 3: Create GIN indexes for JSONB query performance
CREATE INDEX IF NOT EXISTS idx_tasks_citations ON public.tasks USING GIN (citations);
CREATE INDEX IF NOT EXISTS idx_sections_citations ON public.sections USING GIN (citations);

-- Step 4: Add comments
COMMENT ON COLUMN public.tasks.citations IS 'Array of citation objects: [{source_id: uuid, page: number, quote: string, title: string}]';
COMMENT ON COLUMN public.sections.citations IS 'Array of citation objects: [{source_id: uuid, page: number, quote: string, title: string}]';

-- Step 5: Remove old flat fields and related constraints/indexes
-- WARNING: This is a destructive operation - ensure frontend code is updated before execution
ALTER TABLE public.tasks
DROP COLUMN IF EXISTS citation_source_id CASCADE,
DROP COLUMN IF EXISTS citation_page,
DROP COLUMN IF EXISTS citation_quote;

ALTER TABLE public.sections
DROP COLUMN IF EXISTS citation_source_id CASCADE,
DROP COLUMN IF EXISTS citation_page,
DROP COLUMN IF EXISTS citation_quote;

-- Remove old indexes (CASCADE should have handled this already)
DROP INDEX IF EXISTS idx_tasks_citation_source;
DROP INDEX IF EXISTS idx_sections_citation_source;
