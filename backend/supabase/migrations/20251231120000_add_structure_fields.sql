-- Migration: 新增文件結構欄位到 templates 表格
-- 日期: 2025-12-31 12:00
-- 目的: 儲存完整的文件結構 (樣式、段落、表格)

-- 1. 新增欄位
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS styles JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS paragraphs JSONB DEFAULT '[]'::JSONB;

-- 2. 新增註解
COMMENT ON COLUMN public.templates.structure IS '完整文件結構: {"styles": [...], "paragraphs": [...], "tables": [...]}';
COMMENT ON COLUMN public.templates.styles IS '文件樣式列表: [{"id": "a", "name": "Normal", "type": "paragraph"}]';
COMMENT ON COLUMN public.templates.paragraphs IS '段落列表: [{"index": 0, "style": "Normal", "text": "..."}]';

-- 3. 建立索引 (加速查詢)
CREATE INDEX IF NOT EXISTS idx_templates_engine ON public.templates(engine);
CREATE INDEX IF NOT EXISTS idx_templates_version ON public.templates(template_version);

