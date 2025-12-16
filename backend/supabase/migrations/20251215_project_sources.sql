-- Project Sources Relation Table (Project KB)
-- 讓專案可以綁定多個 sources（知識來源）

-- 建立關聯表
CREATE TABLE IF NOT EXISTS public.project_sources (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, source_id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_project_sources_project ON public.project_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sources_source ON public.project_sources(source_id);

-- 啟用 RLS
ALTER TABLE public.project_sources ENABLE ROW LEVEL SECURITY;

-- 開發階段：允許所有操作
CREATE POLICY "Allow all" ON public.project_sources FOR ALL USING (true);

-- 更新 match_chunks 函數以支援 project_sources 關聯
CREATE OR REPLACE FUNCTION match_chunks_by_project (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_project_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  source_title text,
  source_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    s.title AS source_title,
    s.id AS source_id
  FROM chunks c
  JOIN sources s ON c.source_id = s.id
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
  AND (
    -- 來源屬於此專案的 project_sources
    EXISTS (
      SELECT 1 FROM project_sources ps 
      WHERE ps.project_id = filter_project_id 
      AND ps.source_id = s.id
    )
    -- 或者是全域來源（沒有綁定特定專案）
    OR s.project_id IS NULL
  )
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 添加 content 欄位到 sources 表（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sources' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.sources ADD COLUMN content TEXT;
  END IF;
END $$;

