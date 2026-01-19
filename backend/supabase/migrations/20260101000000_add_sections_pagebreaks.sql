-- Migration: 新增節和換頁欄位到 templates 表格
-- 日期: 2026-01-01
-- 目的: 儲存完整的文件結構 (節、換頁、合併儲存格等)

-- 1. 新增欄位
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS page_breaks JSONB DEFAULT '[]'::JSONB;

-- 2. 新增註解
COMMENT ON COLUMN public.templates.sections IS '節列表: [{"type": "nextPage", "pageSize": {...}, "margins": {...}}]';
COMMENT ON COLUMN public.templates.page_breaks IS '換頁位置: [{"type": "before", "paragraphIndex": 5}]';

-- 3. 更新 structure 欄位註解
COMMENT ON COLUMN public.templates.structure IS '完整文件結構: {"styles": [...], "paragraphs": [...], "tables": [...], "sections": [...], "pageBreaks": [...]}';

-- 4. 更新 parsed_tables 欄位註解（支援合併儲存格）
COMMENT ON COLUMN public.templates.parsed_tables IS '表格列表: 支援 colSpan, vMerge, hAlign, vAlign, columnWidths, rowFormats 等屬性';

