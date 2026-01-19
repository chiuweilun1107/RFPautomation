-- Migration: Definitive OCR Schema Fix
-- Date: 2026-01-13
-- Purpose: Ensure the texts table has all columns required by the n8n OCR workflow

-- 1. Add missing top-level columns
ALTER TABLE public.texts 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS confidence numeric,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Add comments
COMMENT ON COLUMN public.texts.image_url IS 'Source image URL for this text block';
COMMENT ON COLUMN public.texts.confidence IS 'OCR confidence score (0-1)';
COMMENT ON COLUMN public.texts.language IS 'Detected language code';
COMMENT ON COLUMN public.texts.metadata IS 'Flexible JSON storage for OCR styles (font_size, etc.) and future extensions.';

-- Note: 'content', 'bbox', 'style' (jsonb), and 'project_id' are already verified to exist.
