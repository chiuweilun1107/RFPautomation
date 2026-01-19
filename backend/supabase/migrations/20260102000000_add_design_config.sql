-- Add design_config column to templates table
-- This column stores the design configuration created by the template designer

ALTER TABLE templates 
ADD COLUMN design_config JSONB DEFAULT NULL;

-- Add index for faster queries on design_config
CREATE INDEX IF NOT EXISTS idx_templates_design_config 
ON templates USING GIN (design_config);

-- Add comment to document the purpose
COMMENT ON COLUMN templates.design_config IS 'Design configuration created by the template designer, including inserted components, deleted components, modified components, and variable bindings';