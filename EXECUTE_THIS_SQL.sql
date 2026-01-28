-- ============================================
-- 📋 標案狀態自動化 Migration
-- 執行步驟：
-- 1. 開啟 Supabase Dashboard SQL Editor
-- 2. 複製並執行此 SQL
-- 3. 驗證結果
-- ============================================

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
-- 步驟 3：建立定時更新 Function（供 Edge Function 調用）
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
-- 驗證結果
-- ============================================

-- 查看各狀態的標案數量
SELECT
    status,
    COUNT(*) as count
FROM public.tenders
GROUP BY status
ORDER BY count DESC;

-- 顯示成功訊息
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 執行完成！';
    RAISE NOTICE '📊 請查看上方的統計結果';
    RAISE NOTICE '🎯 接下來請執行 Edge Function 測試';
END $$;
