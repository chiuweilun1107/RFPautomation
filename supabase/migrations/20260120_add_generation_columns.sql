-- Add generation tracking columns to sections table
ALTER TABLE sections ADD COLUMN IF NOT EXISTS generation_method TEXT DEFAULT 'manual';
ALTER TABLE sections ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT false;

-- Update existing records to reflect they are manual by default
UPDATE sections SET generation_method = 'manual' WHERE generation_method IS NULL;
UPDATE sections SET is_modified = false WHERE is_modified IS NULL;
