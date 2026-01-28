# ⚡ 快速開始：3 步驟完成標案狀態自動化

## 🎯 總覽

**目標**：修正標案狀態顯示錯誤 + 建立自動更新機制

**已完成**：
- ✅ Edge Function 已部署（`update-tender-status`）
- ✅ 部署指南已準備

**待完成**：
- ⏳ 執行資料庫 Migration
- ⏳ 設定 Cron Job

**預計時間**：10 分鐘

---

## 📋 步驟 1：執行資料庫 Migration（5 分鐘）

### **1.1 開啟 Supabase Dashboard**

點擊此連結：
```
https://supabase.com/dashboard/project/goyonrowhfphooryfzif/sql/new
```

### **1.2 複製並執行 SQL**

開啟檔案：
```
EXECUTE_THIS_SQL.sql
```

複製全部內容，貼到 Supabase SQL Editor，然後點擊 **Run**。

### **1.3 驗證結果**

執行完成後，您應該會看到類似以下的統計結果：

```
status      | count
------------|------
招標中      | 150
已截止      | 23
已決標      | 10
```

✅ **確認**：如果看到「已截止」的數量 > 0，表示執行成功

---

## 🧪 步驟 2：測試 Edge Function（2 分鐘）

### **2.1 執行測試腳本**

在終端機執行：

```bash
cd "/Users/chiuyongren/Desktop/AI dev"
chmod +x test-edge-function.sh
./test-edge-function.sh
```

### **2.2 預期輸出**

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

✅ Edge Function 執行成功！
```

✅ **確認**：如果看到 `"success": true`，表示 Edge Function 正常運作

---

## ⏰ 步驟 3：設定 Cron Job（3 分鐘）

### **選項 A：使用 cron-job.org（推薦，最簡單）** ⭐

#### **3.1 註冊並登入**

前往：https://cron-job.org/en/signup/

（免費，無需信用卡）

#### **3.2 建立 Cron Job**

登入後點擊 **Create cronjob**：

**基本設定**：
- **Title**: `Update Tender Status Daily`
- **Address (URL)**:
  ```
  https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status
  ```

**Schedule**：
- 選擇 **Every day**
- 時間：`01:00`（凌晨 1 點）

**Advanced**：
- **Request method**: `POST`
- **Request headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTEwODcsImV4cCI6MjA4MTE4NzA4N30.uhXDnI7IvyAqu-DwrWrCZlTYDUFJl6Jb96WYq_j59WU
  ```

#### **3.3 測試執行**

點擊 **Run now** 立即測試。

✅ **確認**：如果執行歷史顯示 `200 OK`，表示設定成功

---

### **選項 B：使用 GitHub Actions（進階）**

如果您的專案有 GitHub Repository，可以使用 GitHub Actions：

創建檔案：`.github/workflows/update-tender-status.yml`

```yaml
name: Update Tender Status Daily

on:
  schedule:
    # 每天 UTC 01:00 執行
    - cron: '0 1 * * *'
  workflow_dispatch: # 允許手動觸發

jobs:
  update-status:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            'https://goyonrowhfphooryfzif.supabase.co/functions/v1/update-tender-status' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json'
```

然後在 GitHub Repository > Settings > Secrets 添加：
- `SUPABASE_ANON_KEY` = 您的 Anon Key

---

## ✅ 完成檢查清單

完成以下步驟後，您的系統就完全自動化了：

- [ ] 執行 `EXECUTE_THIS_SQL.sql`（步驟 1）
- [ ] 執行 `test-edge-function.sh` 確認成功（步驟 2）
- [ ] 在 cron-job.org 設定定時任務（步驟 3）
- [ ] 測試前端顯示：選擇「全部」，確認已截止標案顯示正確

---

## 🎉 完成後的效果

### **自動化流程**

```
每天凌晨 1:00
    ↓
Cron Job 觸發 Edge Function
    ↓
Edge Function 調用 daily_update_tender_status()
    ↓
資料庫更新所有已過期標案的 status
    ↓
前端顯示正確的狀態
```

### **立即看到的改善**

1. **選擇「全部」時**：
   - 已截止標案顯示「已截止」✅（不再是「招標中」❌）

2. **選擇「已截止」時**：
   - 篩選正確，數量正確 ✅

3. **未來的標案**：
   - 新增標案時自動設定正確狀態（觸發器）
   - 每天自動更新過期標案（定時任務）

---

## 📊 監控和維護

### **查看 Edge Function 執行歷史**

1. 開啟 Supabase Dashboard：
   ```
   https://supabase.com/dashboard/project/goyonrowhfphooryfzif/functions
   ```

2. 點擊 **update-tender-status** > **Logs**

3. 查看執行歷史和狀態

### **查看 Cron Job 執行歷史**

登入 cron-job.org > Cronjobs > Update Tender Status Daily > History

---

## ⚠️ 如果遇到問題

### **問題 1：SQL 執行失敗**

**解決**：
- 確認您有資料庫的修改權限
- 分段執行 SQL（先執行 UPDATE，再執行 CREATE FUNCTION）

### **問題 2：Edge Function 測試失敗**

**解決**：
- 確認已執行步驟 1 的 SQL
- 檢查 `daily_update_tender_status` 函數是否存在：
  ```sql
  SELECT proname FROM pg_proc WHERE proname = 'daily_update_tender_status';
  ```

### **問題 3：前端還是顯示錯誤**

**解決**：
- 清除瀏覽器快取
- 重新載入頁面
- 檢查瀏覽器 DevTools > Network 查看 API 回傳的資料

---

## 📞 需要幫助？

如果遇到任何問題，請查看詳細指南：
- 完整部署指南：`DEPLOY_EDGE_FUNCTION_GUIDE.md`
- 原始修正指南：`TENDER_STATUS_FIX_GUIDE.md`

---

**預計完成時間**：10 分鐘
**建議執行時間**：現在！（立即修正問題）

🚀 **開始吧！**
