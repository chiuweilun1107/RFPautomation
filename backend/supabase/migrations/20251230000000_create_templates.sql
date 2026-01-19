-- Create Templates Table (範本庫)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,  -- Supabase Storage 路徑
    category TEXT,  -- 例如: "標案投標", "提案書", "報告"
    mapping_rules JSONB DEFAULT '{}'::JSONB,  -- 章節對應規則
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,  -- 是否為公開範本
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_owner ON public.templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON public.templates(is_public);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates"
    ON public.templates FOR SELECT
    USING (auth.uid() = owner_id OR is_public = true);

CREATE POLICY "Users can insert their own templates"
    ON public.templates FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own templates"
    ON public.templates FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own templates"
    ON public.templates FOR DELETE
    USING (auth.uid() = owner_id);

-- Add comment
COMMENT ON TABLE public.templates IS '文件範本庫 - 儲存 Word 範本及其對應規則';
COMMENT ON COLUMN public.templates.mapping_rules IS 'JSON 格式的章節對應規則,例如: {"壹、摘要及說明": "section_summary"}';

