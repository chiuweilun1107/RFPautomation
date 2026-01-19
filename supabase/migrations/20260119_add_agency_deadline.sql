-- Add agency and deadline columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS agency TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
