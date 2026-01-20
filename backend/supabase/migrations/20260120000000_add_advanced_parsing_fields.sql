-- Migration: 新增進階解析欄位到 templates 表格
-- 日期: 2026-01-20
-- 目的: 支援 100% Word 文件解析功能 (17 項完整功能)
-- 新增功能: 頁首頁尾、完整樣式定義、腳註尾註、圖表、文字方塊、評論、修訂追蹤

-- 1. 新增欄位到 templates 表格
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS headers_footers JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS styles_definitions JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS footnotes_endnotes JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS charts JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS text_boxes JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS revisions JSONB DEFAULT '{}'::JSONB;

-- 2. 新增註解
COMMENT ON COLUMN public.templates.headers_footers IS '頁首頁尾: {"headers": [{"type": "first", "paragraphs": [...]}], "footers": [...]}';
COMMENT ON COLUMN public.templates.styles_definitions IS '完整樣式定義: [{"style_id": "Heading1", "name": "標題 1", "font": {...}, "paragraph": {...}}]';
COMMENT ON COLUMN public.templates.footnotes_endnotes IS '腳註尾註: {"footnotes": [{"id": "1", "text": "..."}], "endnotes": [...]}';
COMMENT ON COLUMN public.templates.charts IS '圖表: [{"id": "...", "type": "bar", "title": "...", "rel_id": "..."}]';
COMMENT ON COLUMN public.templates.text_boxes IS '文字方塊: [{"id": "...", "paragraphs": [...], "position": {...}}]';
COMMENT ON COLUMN public.templates.comments IS '評論: [{"id": "1", "author": "...", "date": "...", "text": "..."}]';
COMMENT ON COLUMN public.templates.revisions IS '修訂追蹤: {"insertions": [...], "deletions": [...], "moves": [...]}';

-- 3. 更新 templates 表的整體註解
COMMENT ON TABLE public.templates IS '文件範本庫 - 儲存 Word 範本及其完整解析資料 (支援 17 項解析功能)';
