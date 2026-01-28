# 標案狀態修正與自動更新指南

## 🎯 問題描述

- **現象**：選擇「已截止」篩選器時，標案正確顯示，但 STATUS 欄位顯示「招標中」
- **原因**：資料庫的 `status` 欄位沒有根據 `deadline_date` 自動更新
- **影響**：當用戶選擇「全部」時，所有標案都顯示「招標中」，造成誤會

---

## 🛠️ 解決方案

### **方案總覽**

```
1. 立即修正現有資料（一次性 SQL）
    ↓
2. 建立自動更新機制（觸發器 + 定時任務）
    ↓
3. 確保未來資料永遠正確
```

---

## 📋 執行步驟

### **步驟 1：執行資料庫 Migration（必須）**

#### **1.1 執行主要修正 Migration**

```bash
# 進入專案目錄
cd /Users/chiuyongren/Desktop/AI\ dev

# 如果使用 Supabase CLI
supabase db push

# 或者手動執行 SQL
# 在 Supabase Dashboard > SQL Editor 中執行：
# backend/supabase/migrations/20260128_fix_tender_status.sql
```

**這個 Migration 會做什麼？**
- ✅ 立即更新所有已截止標案的 status 為「已截止」
- ✅ 更新所有招標中標案的 status 為「招標中」
- ✅ 建立觸發器：當 `deadline_date` 更新時自動計算 `status`
- ✅ 建立函數：`daily_update_tender_status()` 用於定時更新

---

### **步驟 2：設定定時任務（選擇一種方式）**

#### **選項 A：使用 pg_cron（推薦）** ⭐

**優點**：
- ✅ 直接在資料庫層運作，效能最佳
- ✅ 不需要額外的服務或函數
- ✅ 可靠性高

**執行方式**：

1. **啟用 pg_cron 擴展**
   - 登入 Supabase Dashboard
   - 前往 Database > Extensions
   - 搜尋 `pg_cron` 並啟用

2. **執行定時任務 Migration**
   ```bash
   # 執行 SQL
   supabase db push

   # 或在 Supabase Dashboard > SQL Editor 執行：
   # backend/supabase/migrations/20260128_setup_cron_job.sql
   ```

3. **驗證定時任務已設定**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'daily-update-tender-status';
   ```

   應該會看到：
   ```
   jobid | schedule   | command                                  | active
   ------|------------|------------------------------------------|-------
   1     | 0 1 * * *  | SELECT daily_update_tender_status()      | t
   ```

4. **手動測試**（可選）
   ```sql
   -- 立即執行一次看效果
   SELECT daily_update_tender_status();
   ```

---

#### **選項 B：使用 Supabase Edge Function（備選）**

**優點**：
- ✅ 可以加入更複雜的邏輯
- ✅ 可以發送通知或記錄日誌
- ✅ 更容易監控和除錯

**執行方式**：

1. **部署 Edge Function**
   ```bash
   # 部署函數
   supabase functions deploy update-tender-status

   # 設定環境變數（如果需要）
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here
   ```

2. **在 Supabase Dashboard 設定 Cron**
   - 前往 Database > Cron Jobs
   - 新增 Cron Job：
     - Name: `update-tender-status-daily`
     - Schedule: `0 1 * * *`（每天凌晨 1:00）
     - Command:
       ```sql
       SELECT
         net.http_post(
             url:='https://your-project.supabase.co/functions/v1/update-tender-status',
             headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
         ) as request_id;
       ```

3. **手動測試**
   ```bash
   # 使用 curl 測試
   curl -X POST \
     'https://your-project.supabase.co/functions/v1/update-tender-status' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json'
   ```

---

### **步驟 3：驗證修正結果**

#### **3.1 檢查資料庫狀態**

```sql
-- 查看各狀態的標案數量
SELECT
    status,
    COUNT(*) as count
FROM public.tenders
GROUP BY status
ORDER BY count DESC;
```

應該會看到：
```
status      | count
------------|------
招標中      | 150
已截止      | 23
已決標      | 10
已撤案      | 2
```

#### **3.2 檢查特定已截止標案**

```sql
-- 查看所有已截止的標案
SELECT
    id,
    title,
    deadline_date,
    status
FROM public.tenders
WHERE deadline_date <= CURRENT_TIMESTAMP
  AND status NOT IN ('已撤案', '已廢標', '已決標')
ORDER BY deadline_date DESC
LIMIT 10;
```

所有 `deadline_date` 已過期的標案，`status` 應該都是「已截止」。

#### **3.3 前端驗證**

1. 前往 http://localhost:3000/dashboard/tenders
2. 選擇「全部」篩選器
3. 檢查已過期標案的 STATUS 欄位
4. 應該顯示「已截止」而不是「招標中」

---

## 🔄 運作機制說明

### **自動更新的三層保障**

#### **1. 觸發器（Trigger）**
```
當標案的 deadline_date 被新增或修改時
    ↓
自動計算並設定 status
    ↓
確保新資料永遠正確
```

**觸發時機**：
- 新增標案（INSERT）
- 修改 deadline_date（UPDATE）

**不會觸發**：
- status 已經是明確狀態（已撤案、已廢標、已決標）

#### **2. 定時任務（Cron Job）**
```
每天凌晨 1:00
    ↓
掃描所有標案
    ↓
將已過期但 status = '招標中' 的標案更新為「已截止」
    ↓
確保舊資料也會被更新
```

**為什麼需要定時任務？**
- 觸發器只在資料變動時執行
- 但標案可能在建立後不再修改
- 所以需要定時任務來更新這些「靜止」的標案

#### **3. 狀態計算邏輯**
```
if status IN ('已撤案', '已廢標', '已決標'):
    保持不變（這是明確的人工標記狀態）

elif deadline_date is NULL:
    status = '招標中'

elif deadline_date <= NOW():
    status = '已截止'

else:
    status = '招標中'
```

---

## 🧪 測試計劃

### **測試案例 1：立即修正**

```sql
-- 測試前：查看目前狀態
SELECT status, COUNT(*) FROM tenders GROUP BY status;

-- 執行 migration
-- ... 執行步驟 1 的 SQL ...

-- 測試後：再次查看
SELECT status, COUNT(*) FROM tenders GROUP BY status;

-- 預期：應該看到「已截止」的標案數量增加
```

### **測試案例 2：觸發器**

```sql
-- 新增一個已過期的標案
INSERT INTO tenders (title, deadline_date, keyword_tag)
VALUES ('測試標案', '2026-01-20', 'test');

-- 檢查 status 應該自動設為「已截止」
SELECT title, deadline_date, status
FROM tenders
WHERE title = '測試標案';
```

### **測試案例 3：定時任務**

```sql
-- 手動修改一個標案為錯誤狀態
UPDATE tenders
SET status = '招標中'
WHERE deadline_date = '2026-01-20';

-- 手動執行定時任務函數
SELECT daily_update_tender_status();

-- 檢查狀態應該被修正回「已截止」
SELECT title, deadline_date, status
FROM tenders
WHERE deadline_date = '2026-01-20';
```

---

## 📊 監控與維護

### **監控定時任務執行狀態**

```sql
-- 查看 pg_cron 執行歷史
SELECT
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-update-tender-status')
ORDER BY start_time DESC
LIMIT 10;
```

### **手動觸發更新（緊急情況）**

```sql
-- 如果發現資料不正確，可以立即執行
SELECT daily_update_tender_status();
```

---

## ⚠️ 注意事項

### **關於明確狀態的保護**

以下狀態**不會被自動更新**：
- ✅ `已撤案`：人工標記，需保持
- ✅ `已廢標`：人工標記，需保持
- ✅ `已決標`：人工標記，需保持

只有以下狀態會被自動計算：
- ⚡ `招標中` ↔️ `已截止`（根據 `deadline_date` 自動切換）

### **資料完整性**

- 觸發器只在 `deadline_date` 變動時執行
- 如果直接修改 `status` 欄位，觸發器不會覆蓋
- 如果需要強制重新計算，請手動執行 `SELECT daily_update_tender_status()`

### **效能考量**

- 定時任務每天只執行一次，對資料庫負載影響極小
- 觸發器只在資料變動時執行，不會影響查詢效能
- 建議在流量低峰時段（凌晨）執行定時任務

---

## 🎉 完成檢查清單

完成以下檢查後，您的標案狀態系統就完全正常了：

- [ ] 執行 `20260128_fix_tender_status.sql` migration
- [ ] 選擇並設定定時任務（pg_cron 或 Edge Function）
- [ ] 驗證資料庫中已截止標案的 status 正確
- [ ] 前端測試：選擇「全部」，確認狀態顯示正確
- [ ] 前端測試：選擇「已截止」，確認篩選正確
- [ ] 前端測試：選擇「招標中」，確認篩選正確
- [ ] 設定監控（可選）

---

## 📞 問題排查

### **Q1：執行 migration 後狀態還是錯誤？**

**檢查**：
```sql
-- 檢查觸發器是否存在
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_tender_status';

-- 檢查函數是否存在
SELECT * FROM pg_proc WHERE proname = 'daily_update_tender_status';
```

**解決**：
如果不存在，重新執行 migration。

### **Q2：定時任務沒有執行？**

**檢查**：
```sql
-- 查看定時任務狀態
SELECT * FROM cron.job WHERE jobname = 'daily-update-tender-status';

-- 查看執行歷史
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

**解決**：
- 確認 pg_cron 擴展已啟用
- 檢查任務的 `active` 欄位是否為 `true`
- 手動執行一次測試：`SELECT daily_update_tender_status();`

### **Q3：前端還是顯示錯誤？**

**檢查**：
1. 清除瀏覽器快取並重新載入
2. 檢查前端是否正確讀取 `status` 欄位
3. 在瀏覽器 DevTools > Network 中查看 API 回傳的資料

**解決**：
如果 API 回傳的 `status` 正確但前端顯示錯誤，可能需要修改前端顯示邏輯。

---

## 📚 相關檔案

- Migration 1: `backend/supabase/migrations/20260128_fix_tender_status.sql`
- Migration 2: `backend/supabase/migrations/20260128_setup_cron_job.sql`
- Edge Function: `backend/supabase/functions/update-tender-status/index.ts`
- 前端組件: `frontend/src/components/dashboard/tenders/TenderList.tsx`

---

**作者**：Claude Code QA Team
**日期**：2026-01-28
**版本**：1.0
