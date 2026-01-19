-- Migration: 新增 easy-template-x 所需欄位到 templates 表格
-- 日期: 2025-12-31
-- 目的: 支援 100% 樣式保留的文件生成

-- 1. 新增欄位到 templates 表格
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS parsed_fields JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS parsed_tables JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS template_version TEXT DEFAULT 'v2',
ADD COLUMN IF NOT EXISTS engine TEXT DEFAULT 'easy-template-x';

-- 2. 新增註解
COMMENT ON COLUMN public.templates.parsed_fields IS '解析出的欄位列表: [{"name": "customer_name", "label": "客戶名稱", "type": "text"}]';
COMMENT ON COLUMN public.templates.parsed_tables IS '解析出的表格列表: [{"name": "items", "columns": [...]}]';
COMMENT ON COLUMN public.templates.template_version IS '範本版本: v1 (docxtpl) 或 v2 (easy-template-x)';
COMMENT ON COLUMN public.templates.engine IS '渲染引擎: docxtpl 或 easy-template-x';

-- 3. 建立 generated_documents 表格 (如果不存在)
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,  -- Supabase Storage 路徑
    file_url TEXT,  -- 公開下載連結
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,  -- 額外資訊 (檔案大小、生成時間等)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 建立索引
CREATE INDEX IF NOT EXISTS idx_generated_documents_project ON public.generated_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template ON public.generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_user ON public.generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON public.generated_documents(status);

-- 5. 啟用 RLS
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- 6. 建立 RLS 政策
CREATE POLICY "Users can view their own generated documents"
    ON public.generated_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated documents"
    ON public.generated_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated documents"
    ON public.generated_documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated documents"
    ON public.generated_documents FOR DELETE
    USING (auth.uid() = user_id);

-- 7. 建立 Storage Bucket (如果不存在)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-documents', 'generated-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage 政策
DO $$
BEGIN
    -- 刪除舊政策 (如果存在)
    DROP POLICY IF EXISTS "Users can upload generated documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view generated documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete generated documents" ON storage.objects;
    
    -- 建立新政策
    CREATE POLICY "Users can upload generated documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'generated-documents');
    
    CREATE POLICY "Users can view generated documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'generated-documents');
    
    CREATE POLICY "Users can delete generated documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'generated-documents');
END $$;

-- 9. 新增註解
COMMENT ON TABLE public.generated_documents IS '生成的文件記錄 - 追蹤所有透過範本生成的文件';
COMMENT ON COLUMN public.generated_documents.metadata IS 'JSON 格式的額外資訊: {"file_size": 12345, "generation_time_ms": 1234}';

