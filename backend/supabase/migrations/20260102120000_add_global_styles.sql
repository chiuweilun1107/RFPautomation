-- Migration: 新增解析出的全域樣式欄位
-- 日期: 2026-01-02
-- 目的: 儲存從 Docx 解析出的全域樣式設定 (Global Styles)

-- 1. 新增欄位
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS parsed_styles JSONB DEFAULT '{}'::JSONB;

-- 2. 新增註解
COMMENT ON COLUMN public.templates.parsed_styles IS '全域樣式: {"default_font": "...", "default_size": 12, ...}';
