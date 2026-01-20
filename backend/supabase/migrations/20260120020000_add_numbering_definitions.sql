-- Migration: 新增 numbering_definitions 欄位到 templates 表格
-- 日期: 2026-01-20
-- 目的: 支援完整的編號樣式定義提取（中文編號、羅馬數字等）
-- 功能: 從 numbering.xml 提取編號格式定義，支援多層次編號渲染

-- 新增 numbering_definitions 欄位
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS numbering_definitions JSONB DEFAULT '{}'::JSONB;

-- 新增註解
COMMENT ON COLUMN public.templates.numbering_definitions IS '編號樣式定義: {"num_id_mapping": {"1": "0"}, "abstract_nums": {"0": {"levels": {"0": {"format": "chineseCounting", "text": "%1、"}}}}}';

-- 更新 templates 表的整體註解
COMMENT ON TABLE public.templates IS '文件範本庫 - 儲存 Word 範本及其完整解析資料 (支援 18 項解析功能，包含編號樣式定義)';
