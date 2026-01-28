-- ============================================
-- 調查標案狀態數量問題
-- ============================================

-- 步驟 1：查看所有標案的狀態分佈
SELECT
    status,
    COUNT(*) as count
FROM public.tenders
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- 步驟 2：查詢所有已過期的標案（不管 status 是什麼）
-- ============================================

SELECT
    COUNT(*) as total_expired_tenders,
    COUNT(CASE WHEN status = '已截止' THEN 1 END) as status_correct,
    COUNT(CASE WHEN status != '已截止' OR status IS NULL THEN 1 END) as status_wrong
FROM public.tenders
WHERE deadline_date IS NOT NULL
  AND deadline_date <= CURRENT_TIMESTAMP;

-- ============================================
-- 步驟 3：查看已過期但狀態不正確的標案（前 20 筆）
-- ============================================

SELECT
    id,
    title,
    deadline_date,
    status,
    publish_date,
    CURRENT_TIMESTAMP as now,
    (CURRENT_TIMESTAMP - deadline_date) as overdue_duration
FROM public.tenders
WHERE deadline_date IS NOT NULL
  AND deadline_date <= CURRENT_TIMESTAMP
  AND (status != '已截止' OR status IS NULL)
ORDER BY deadline_date DESC
LIMIT 20;

-- ============================================
-- 步驟 4：查看已過期標案的狀態分佈
-- ============================================

SELECT
    status,
    COUNT(*) as count,
    MIN(deadline_date) as earliest_deadline,
    MAX(deadline_date) as latest_deadline
FROM public.tenders
WHERE deadline_date IS NOT NULL
  AND deadline_date <= CURRENT_TIMESTAMP
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- 步驟 5：檢查是否有 NULL status 的已過期標案
-- ============================================

SELECT
    COUNT(*) as null_status_count
FROM public.tenders
WHERE deadline_date IS NOT NULL
  AND deadline_date <= CURRENT_TIMESTAMP
  AND status IS NULL;

-- ============================================
-- 步驟 6：查看觸發器是否存在
-- ============================================

SELECT
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'trigger_update_tender_status';

-- ============================================
-- 診斷結論
-- ============================================

-- 根據以上查詢結果：
-- 1. 如果 total_expired_tenders > status_correct，表示有很多已過期標案狀態不正確
-- 2. 查看步驟 4 的結果，了解這些標案的 status 是什麼
-- 3. 可能原因：
--    a) Migration SQL 的 WHERE 條件太嚴格（只更新 status = '招標中' 的）
--    b) 有些標案的 status 是 NULL
--    c) 有些標案的 status 是其他值
