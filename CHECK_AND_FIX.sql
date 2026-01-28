-- ============================================
-- 檢查並修正資料庫函數
-- ============================================

-- 步驟 1：檢查函數是否存在
SELECT
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'daily_update_tender_status';

-- 如果上面沒有返回結果，表示函數不存在，請執行下面的 SQL

-- ============================================
-- 重新建立函數（如果不存在）
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
-- 驗證函數創建成功
-- ============================================

SELECT
    proname as function_name,
    pronargs as num_args,
    prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'daily_update_tender_status';

-- ============================================
-- 測試執行函數
-- ============================================

SELECT daily_update_tender_status();

-- ============================================
-- 查看結果
-- ============================================

SELECT status, COUNT(*) as count
FROM tenders
GROUP BY status
ORDER BY count DESC;
