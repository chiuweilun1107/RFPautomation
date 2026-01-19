-- Add content column to sections table for storing integrated chapter text
ALTER TABLE sections ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS last_integrated_at TIMESTAMP WITH TIME ZONE;
