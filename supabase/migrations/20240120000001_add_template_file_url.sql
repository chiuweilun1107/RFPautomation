-- Add template_file_url column to sections table
ALTER TABLE sections ADD COLUMN IF NOT EXISTS template_file_url TEXT;
