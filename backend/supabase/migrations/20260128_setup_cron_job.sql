-- Migration: 設定每日自動更新標案狀態的定時任務
-- Created: 2026-01-28
-- Description: 使用 pg_cron 每天凌晨 1:00 自動更新標案狀態

-- 注意：此 migration 需要 pg_cron 擴展
-- 在 Supabase Dashboard > Database > Extensions 中啟用 pg_cron

-- ============================================
-- 啟用 pg_cron 擴展（如果尚未啟用）
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 設定每日定時任務：每天凌晨 1:00 執行
-- ============================================

-- 先刪除舊的任務（如果存在）
SELECT cron.unschedule('daily-update-tender-status');

-- 建立新的定時任務
SELECT cron.schedule(
    'daily-update-tender-status',           -- 任務名稱
    '0 1 * * *',                            -- Cron 表達式：每天凌晨 1:00
    $$SELECT daily_update_tender_status()$$ -- 要執行的 SQL
);

-- ============================================
-- 查看定時任務狀態
-- ============================================

-- 查看已設定的任務
SELECT * FROM cron.job WHERE jobname = 'daily-update-tender-status';

-- ============================================
-- 註解說明
-- ============================================

COMMENT ON EXTENSION pg_cron IS
'PostgreSQL 定時任務擴展，用於排程資料庫操作。
每天凌晨 1:00 自動執行 daily_update_tender_status() 更新標案狀態。';

-- ============================================
-- 手動測試定時任務（可選）
-- ============================================

-- 如果您想立即測試，可以手動執行：
-- SELECT daily_update_tender_status();
