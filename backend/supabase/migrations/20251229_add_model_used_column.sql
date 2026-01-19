-- Add model_used column to project_assessments table
-- This tracks which AI model was used for the assessment (gemini-2.0-flash or ollama-qwen2.5)

ALTER TABLE public.project_assessments 
ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gemini-2.0-flash';

COMMENT ON COLUMN public.project_assessments.model_used IS 'AI model used for assessment: gemini-2.0-flash or ollama-qwen2.5';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_project_assessments_model_used 
ON public.project_assessments(model_used);

