-- Migration: 修正標案狀態並建立自動更新機制
-- Created: 2026-01-28
-- Description:
--   1. 一次性更新所有已截止標案的 status
--   2. 建立 PostgreSQL Function 自動計算狀態
--   3. 建立觸發器確保資料一致性

-- ============================================
-- 步驟 1：一次性修正現有資料
-- ============================================

-- 更新所有已截止的標案（deadline_date 已過期）
UPDATE public.tenders
SET status = '已截止'
WHERE deadline_date IS NOT NULL
  AND deadline_date <= CURRENT_TIMESTAMP
  AND (status IS NULL OR status = '招標中')
  AND status NOT IN ('已撤案', '已廢標', '已決標');

-- 更新所有招標中的標案（deadline_date 未過期或為 null）
UPDATE public.tenders
SET status = '招標中'
WHERE (
    deadline_date IS NULL
    OR deadline_date > CURRENT_TIMESTAMP
  )
  AND (status IS NULL OR status = '已截止')
  AND status NOT IN ('已撤案', '已廢標', '已決標');

-- ============================================
-- 步驟 2：建立自動計算狀態的 Function
-- ============================================

CREATE OR REPLACE FUNCTION update_tender_status_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 只在 INSERT 或 UPDATE deadline_date 時自動計算狀態
    -- 如果 status 已經是明確狀態（已撤案、已廢標、已決標），則不修改

    IF NEW.status NOT IN ('已撤案', '已廢標')
       AND (NEW.status IS NULL OR NEW.status NOT LIKE '%已決標%') THEN

        -- 根據 deadline_date 自動設定狀態
        IF NEW.deadline_date IS NULL THEN
            NEW.status := '招標中';
        ELSIF NEW.deadline_date <= CURRENT_TIMESTAMP THEN
            NEW.status := '已截止';
        ELSE
            NEW.status := '招標中';
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器：在 INSERT 或 UPDATE 時自動更新狀態
DROP TRIGGER IF EXISTS trigger_update_tender_status ON public.tenders;
CREATE TRIGGER trigger_update_tender_status
BEFORE INSERT OR UPDATE OF deadline_date
ON public.tenders
FOR EACH ROW
EXECUTE FUNCTION update_tender_status_on_change();

-- ============================================
-- 步驟 3：建立定時更新 Function（每日更新所有標案狀態）
-- ============================================

CREATE OR REPLACE FUNCTION daily_update_tender_status()
RETURNS void AS $$
BEGIN
    -- 更新已截止的標案
    UPDATE public.tenders
    SET status = '已截止'
    WHERE deadline_date IS NOT NULL
      AND deadline_date <= CURRENT_TIMESTAMP
      AND status = '招標中'
      AND status NOT IN ('已撤案', '已廢標', '已決標');

    RAISE NOTICE 'Daily tender status update completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 步驟 4：註解說明
-- ============================================

COMMENT ON FUNCTION update_tender_status_on_change() IS
'自動更新標案狀態的觸發器函數。
當插入或更新 deadline_date 時，自動計算 status：
- 如果 status 是明確狀態（已撤案、已廢標、已決標），則不修改
- 如果 deadline_date <= 現在，則設為「已截止」
- 如果 deadline_date > 現在或為 null，則設為「招標中」';

COMMENT ON FUNCTION daily_update_tender_status() IS
'每日定時更新標案狀態的函數。
將所有 deadline_date 已過期但 status 還是「招標中」的標案更新為「已截止」。
建議使用 pg_cron 或 Supabase Functions 每天凌晨執行。';

-- ============================================
-- 驗證結果（可選）
-- ============================================

-- 查看已截止標案數量
DO $$
DECLARE
    expired_count INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO expired_count
    FROM public.tenders
    WHERE status = '已截止';

    SELECT COUNT(*) INTO active_count
    FROM public.tenders
    WHERE status = '招標中';

    RAISE NOTICE '已截止標案數量: %', expired_count;
    RAISE NOTICE '招標中標案數量: %', active_count;
END $$;
