-- Create template_folders table
CREATE TABLE IF NOT EXISTS public.template_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add folder_id column to templates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'templates'
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE public.templates
        ADD COLUMN folder_id UUID REFERENCES public.template_folders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_template_folders_owner ON public.template_folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_folder ON public.templates(folder_id);

-- Enable RLS
ALTER TABLE public.template_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own template folders"
    ON public.template_folders FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own template folders"
    ON public.template_folders FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own template folders"
    ON public.template_folders FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own template folders"
    ON public.template_folders FOR DELETE
    USING (auth.uid() = owner_id);

-- Add comment
COMMENT ON TABLE public.template_folders IS '範本資料夾 - 用於組織和管理 Word 範本';

