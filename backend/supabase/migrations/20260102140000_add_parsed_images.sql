-- Migration: 新增解析出的圖片欄位
-- 日期: 2026-01-02
-- 目的: 儲存從 Docx 解析出的圖片連結與位置

-- 1. 新增欄位
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS parsed_images JSONB DEFAULT '[]'::JSONB;

-- 2. 新增註解
COMMENT ON COLUMN public.templates.parsed_images IS '圖片列表: [{"url": "...", "width": 100, "height": 100, "position": ...}]';
