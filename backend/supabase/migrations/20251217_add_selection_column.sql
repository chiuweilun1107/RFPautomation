-- Add selection column to project_assessments table
ALTER TABLE project_assessments 
ADD COLUMN IF NOT EXISTS selection JSONB;

COMMENT ON COLUMN project_assessments.selection IS 'Stores selection method, weights, and criteria in structured JSON format';
