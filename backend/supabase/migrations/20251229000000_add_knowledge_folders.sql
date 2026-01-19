-- Create knowledge_folders table
CREATE TABLE IF NOT EXISTS public.knowledge_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add folder_id column to sources table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sources'
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE public.sources
        ADD COLUMN folder_id UUID REFERENCES public.knowledge_folders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_owner ON public.knowledge_folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_sources_folder ON public.sources(folder_id);

-- Enable RLS
ALTER TABLE public.knowledge_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own folders"
    ON public.knowledge_folders FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own folders"
    ON public.knowledge_folders FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own folders"
    ON public.knowledge_folders FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own folders"
    ON public.knowledge_folders FOR DELETE
    USING (auth.uid() = owner_id);

-- Update sources RLS to allow filtering by folder
CREATE POLICY "Users can view sources in their folders"
    ON public.sources FOR SELECT
    USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM public.knowledge_folders 
            WHERE knowledge_folders.id = sources.folder_id 
            AND knowledge_folders.owner_id = auth.uid()
        )
    );