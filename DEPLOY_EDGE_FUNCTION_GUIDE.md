# 🚀 Edge Function 自動化部署指南

## 📋 總覽

使用 Supabase Edge Function + Cron Job 自動更新標案狀態。

**優勢**：
- ✅ 易於監控和除錯
- ✅ 完整的執行日誌
- ✅ Supabase 原生支援
- ✅ 可視化管理界面

---

## 🎯 部署步驟（3 步驟）

### **步驟 1：執行資料庫 Migration**

#### **1.1 開啟 Supabase Dashboard**

前往：https://supabase.com/dashboard/project/goyonrowhfphooryfzif

#### **1.2 執行 SQL**

1. 點擊左側選單 **SQL Editor**
2. 點擊 **New query**
3. 複製以下 SQL 並執行：

```sql
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
```

#### **1.3 驗證結果**

執行完成後，您應該會看到類似以下的結果：

```
status      | count
------------|------
招標中      | 150
已截止      | 23
已決標      | 10
已撤案      | 2
```

✅ **確認**：已截止的標案數量應該是之前的 23 筆（或更多）

---

### **步驟 2：部署 Edge Function**

#### **2.1 檢查 Edge Function 檔案**

確認檔案存在：
```bash
ls -la backend/supabase/functions/update-tender-status/index.ts
```

應該會看到檔案存在。

#### **2.2 部署 Edge Function**

```bash
cd "/Users/chiuyongren/Desktop/AI dev"

# 部署 Edge Function
supabase functions deploy update-tender-status --project-ref goyonrowhfphooryfzif
```

**預期輸出**：
```
Deploying Function update-tender-status (project: goyonrowhfphooryfzif)
Deploying update-tender-status (./backend/supabase/functions/update-tender-status)
Function URL: https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status
Deployed!
```

#### **2.3 測試 Edge Function**

```bash
# 使用 curl 測試
curl -X POST \
  'https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU' \
  -H 'Content-Type: application/json'
```

**預期回應**：
```json
{
  "success": true,
  "message": "Successfully updated 0 tender(s)",
  "updatedCount": 0,
  "beforeStats": {
    "招標中": 150,
    "已截止": 23,
    "已決標": 10
  },
  "afterStats": {
    "招標中": 150,
    "已截止": 23,
    "已決標": 10
  },
  "timestamp": "2026-01-28T06:00:00.000Z"
}
```

✅ **確認**：如果 `success: true`，表示 Edge Function 正常運作

---

### **步驟 3：設定 Supabase Cron Job**

#### **3.1 開啟 Supabase Dashboard**

前往：https://supabase.com/dashboard/project/goyonrowhfphooryfzif

#### **3.2 開啟 Database Webhooks**

1. 點擊左側選單 **Database** > **Webhooks**
2. 點擊 **Create a new hook**
3. 或者使用 **Cron Jobs**（如果您的專案有此功能）

#### **3.3 設定方式 A：使用 Database Webhooks**

**配置**：
- **Name**: `daily-update-tender-status`
- **Table**: 選擇 `tenders`（或任意表）
- **Events**: 選擇 `INSERT`（這只是觸發條件，不重要）
- **Type**: `HTTP Request`
- **HTTP Request URL**:
  ```
  https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status
  ```
- **HTTP Headers**:
  ```json
  {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU",
    "Content-Type": "application/json"
  }
  ```

**限制**：Webhooks 只在資料變動時觸發，不是真正的定時任務。

---

#### **3.4 設定方式 B：使用 pg_cron（推薦）** ⭐

如果您的 Supabase 專案支援 pg_cron，這是最好的方式。

**在 SQL Editor 執行**：

```sql
-- 啟用 pg_cron 擴展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 設定每日定時任務：每天凌晨 1:00 執行
SELECT cron.schedule(
    'daily-update-tender-status',
    '0 1 * * *',
    $$
    SELECT net.http_post(
        url := 'https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status',
        headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU", "Content-Type": "application/json"}'::jsonb
    );
    $$
);

-- 查看已設定的任務
SELECT * FROM cron.job WHERE jobname = 'daily-update-tender-status';
```

**Cron 表達式說明**：
- `0 1 * * *` = 每天凌晨 1:00（UTC 時區）
- `0 */6 * * *` = 每 6 小時執行一次
- `0 * * * *` = 每小時執行一次

---

#### **3.5 設定方式 C：使用外部 Cron 服務（最簡單）** ⭐⭐⭐

如果 Supabase 的 Cron 功能不可用，可以使用免費的外部服務：

**推薦服務**：
1. **cron-job.org**（免費，推薦）
2. **EasyCron**
3. **GitHub Actions**

**以 cron-job.org 為例**：

1. 前往 https://cron-job.org
2. 註冊免費帳號
3. 建立新的 Cron Job：
   - **Title**: `Update Tender Status Daily`
   - **URL**: `https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status`
   - **Schedule**: `Every day at 01:00`（每天凌晨 1 點）
   - **Request method**: `POST`
   - **HTTP Headers**:
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU
     Content-Type: application/json
     ```
4. 儲存並啟用

**測試**：點擊 "Run now" 立即測試執行

---

## 🧪 驗證和測試

### **測試 1：手動執行 Edge Function**

```bash
curl -X POST \
  'https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU' \
  -H 'Content-Type: application/json' | jq
```

**預期輸出**：
```json
{
  "success": true,
  "message": "Successfully updated 0 tender(s)",
  "updatedCount": 0,
  "beforeStats": { ... },
  "afterStats": { ... },
  "timestamp": "2026-01-28T06:00:00.000Z"
}
```

---

### **測試 2：檢查資料庫狀態**

在 Supabase SQL Editor 執行：

```sql
-- 查看各狀態數量
SELECT status, COUNT(*) as count
FROM tenders
GROUP BY status
ORDER BY count DESC;

-- 查看已截止但狀態錯誤的標案（應該是 0）
SELECT COUNT(*) as wrong_status_count
FROM tenders
WHERE deadline_date <= CURRENT_TIMESTAMP
  AND status = '招標中'
  AND status NOT IN ('已撤案', '已廢標', '已決標');
```

**預期結果**：`wrong_status_count` 應該是 `0`

---

### **測試 3：前端驗證**

1. 前往 http://localhost:3000/dashboard/tenders
2. 選擇「全部」篩選器
3. 檢查已過期標案的 STATUS 欄位
4. ✅ 應該顯示「已截止」而不是「招標中」

---

## 📊 監控和日誌

### **查看 Edge Function 日誌**

1. 開啟 Supabase Dashboard
2. 前往 **Edge Functions** > **update-tender-status**
3. 點擊 **Logs** 標籤
4. 查看執行歷史和錯誤

**日誌範例**：
```
🚀 Starting tender status update function...
📊 Fetching before stats...
📈 Before stats: {"招標中":150,"已截止":23}
🔄 Executing status update...
✅ RPC executed successfully
📊 Fetching after stats...
📈 After stats: {"招標中":150,"已截止":23}
✨ Updated 0 tenders from 招標中 to 已截止
🎉 Tender status update completed successfully!
```

---

## 🔄 更新和維護

### **更新 Edge Function**

如果需要修改 Edge Function 邏輯：

```bash
cd "/Users/chiuyongren/Desktop/AI dev"

# 編輯檔案
# backend/supabase/functions/update-tender-status/index.ts

# 重新部署
supabase functions deploy update-tender-status --project-ref goyonrowhfphooryfzif
```

### **手動觸發更新**

如果需要立即更新標案狀態：

```bash
# 方法 1：調用 Edge Function
curl -X POST 'https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'

# 方法 2：直接調用資料庫函數（在 SQL Editor）
SELECT daily_update_tender_status();
```

---

## ⚠️ 故障排除

### **問題 1：Edge Function 部署失敗**

**錯誤訊息**：`failed to connect to postgres`

**解決方式**：
- 使用 Supabase Dashboard 的 SQL Editor 手動執行 Migration
- 不使用 `supabase link`，直接部署

**替代部署方式**：
```bash
# 使用 --no-verify-jwt 跳過連線檢查
supabase functions deploy update-tender-status \
  --project-ref goyonrowhfphooryfzif \
  --no-verify-jwt
```

---

### **問題 2：Edge Function 回傳 401 錯誤**

**原因**：Authorization header 缺失或錯誤

**解決**：
確認使用正確的 Anon Key：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU
```

---

### **問題 3：Cron Job 沒有執行**

**檢查**：
1. 確認 Edge Function 可以手動調用成功
2. 檢查 Cron Job 的設定是否正確
3. 檢查時區（Supabase 使用 UTC）

**解決**：
- 使用外部 Cron 服務（cron-job.org）更可靠
- 或設定 GitHub Actions 定時執行

---

## 🎉 完成檢查清單

- [ ] 執行資料庫 Migration（步驟 1）
- [ ] 部署 Edge Function（步驟 2）
- [ ] 設定 Cron Job（步驟 3）
- [ ] 測試 Edge Function 手動調用
- [ ] 驗證資料庫狀態正確
- [ ] 前端測試：選擇「全部」確認顯示正確
- [ ] 前端測試：選擇「已截止」確認篩選正確
- [ ] 設定監控（查看 Edge Function 日誌）

---

**完成後，您的標案狀態系統將自動化運作** ✨

每天凌晨 1:00，系統會自動：
1. 掃描所有標案
2. 將已過期的標案從「招標中」更新為「已截止」
3. 記錄執行日誌

您可以隨時查看 Edge Function 日誌來監控執行狀態。
