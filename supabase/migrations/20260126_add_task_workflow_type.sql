-- Add workflow_type column to tasks table to distinguish generation source
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_type TEXT DEFAULT 'manual';

-- Comment on column
COMMENT ON COLUMN tasks.workflow_type IS 'Source workflow type: manual, wf11_functional, wf13_article';

-- Update existing records to reflect they are manual by default
UPDATE tasks SET workflow_type = 'manual' WHERE workflow_type IS NULL;
