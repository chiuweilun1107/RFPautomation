-- Migration: 新增語義標記功能到 templates 表格
-- 日期: 2026-01-27
-- 目的: 支援手動標記段落語義角色，供 AI 生成時套用格式

-- 1. 新增 semantic_mappings 欄位
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS semantic_mappings JSONB DEFAULT '[]'::JSONB;

-- 2. 新增 paragraphs 欄位（如果不存在）
-- 用於儲存文檔的段落結構
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS paragraphs JSONB DEFAULT '[]'::JSONB;

-- 3. 新增註解
COMMENT ON COLUMN public.templates.semantic_mappings IS '語義標記陣列: [{"paragraph_index": 0, "semantic_role": "heading1", "label": "專案標題", "ai_placeholder": "{project_title}"}]';
COMMENT ON COLUMN public.templates.paragraphs IS '文檔段落列表: [{"id": "uuid", "text": "內容", "style": "Normal", "format": {...}, "index": 0}]';

-- 4. 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_templates_semantic_mappings ON public.templates USING GIN (semantic_mappings);
CREATE INDEX IF NOT EXISTS idx_templates_paragraphs ON public.templates USING GIN (paragraphs);
