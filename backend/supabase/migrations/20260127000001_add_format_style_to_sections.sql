-- Migration: 為 sections 表格添加格式樣式欄位
-- 日期: 2026-01-27
-- 目的: 儲存每個章節的格式標記（heading1、heading2、content 等）

-- 1. 新增 format_style 欄位
ALTER TABLE public.sections
ADD COLUMN IF NOT EXISTS format_style TEXT DEFAULT 'content';

-- 2. 新增索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_sections_format_style ON public.sections(format_style);

-- 3. 新增註解
COMMENT ON COLUMN public.sections.format_style IS '格式樣式標記: heading1, heading2, heading3, content, list, quote, note 等';

-- 4. 更新現有資料的預設值（根據層級自動判斷）
UPDATE public.sections
SET format_style = CASE
    -- 章節層級（Chapter）-> heading1
    WHEN parent_section_id IS NULL THEN 'heading1'
    -- 小節層級（Section）-> heading2
    WHEN parent_section_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sections s2
        WHERE s2.parent_section_id = sections.id
    ) THEN 'heading2'
    -- 內容層級 -> content
    ELSE 'content'
END
WHERE format_style IS NULL OR format_style = 'content';
