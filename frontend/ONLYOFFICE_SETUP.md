# ONLYOFFICE 編輯器設置和保存功能

## 功能說明

ONLYOFFICE 編輯器已整合到模板編輯頁面 `/dashboard/templates/[id]/design`。

## 保存機制

### 自動保存（需要配置）

ONLYOFFICE 支持自動保存功能，當用戶：
- 按 `Ctrl+S`（或 Mac 的 `Cmd+S`）
- 點擊編輯器工具列的保存按鈕
- 關閉文檔時

編輯器會調用 **callback URL** 將文檔保存到伺服器。

### Callback URL 配置

**問題：** ONLYOFFICE 伺服器（5.78.118.41）無法訪問 `localhost:3000`

**解決方案：使用 Localtunnel（推薦）**

#### 1. 安裝 Localtunnel

```bash
npm install -g localtunnel
```

#### 2. 啟動 Localtunnel

```bash
lt --port 3000
```

你會看到類似輸出：
```
your url is: https://fair-feet-double.loca.lt
```

#### 3. 測試 callback

使用 localtunnel URL 訪問應用：
```
https://your-url.loca.lt/dashboard/templates/[id]/design
```

**注意：** 第一次訪問時，localtunnel 會顯示警告頁面，點擊 "Continue" 即可。

現在 ONLYOFFICE 可以調用：
```
https://your-url.loca.lt/api/onlyoffice-callback
```

保存功能就能正常工作了！

**替代方案：使用 ngrok**

如果你已有 ngrok 帳號：

```bash
# 1. 安裝
brew install ngrok

# 2. 配置 authtoken (從 https://dashboard.ngrok.com/get-started/your-authtoken 獲取)
ngrok authtoken YOUR_AUTH_TOKEN

# 3. 啟動
ngrok http 3000
```

## API 端點

### POST /api/onlyoffice-callback

接收 ONLYOFFICE Document Server 的保存回調。

**流程：**
1. ONLYOFFICE 用戶保存文檔
2. Document Server 將編輯後的文檔 POST 到 callback URL
3. API 下載文檔
4. 上傳到 Supabase Storage (`documents` bucket)
5. 更新 `templates` 表的 `file_path`

**Callback Body:**
```json
{
  "status": 2,
  "url": "http://5.78.118.41:8080/cache/files/...",
  "key": "template_{templateId}_{timestamp}"
}
```

**Status 代碼：**
- `2` - 文檔已準備好保存
- `6` - 文檔正在編輯，但當前用戶已保存

## 測試保存功能

1. 啟動 localtunnel:
   ```bash
   lt --port 3000
   ```

2. 使用 localtunnel URL 訪問應用（第一次會有警告頁面，點擊 "Continue"）

3. 上傳並編輯文檔

4. 在編輯器中按 `Ctrl+S` (或 Mac 的 `Cmd+S`) 保存

5. 檢查瀏覽器 Console 和伺服器日誌，應該看到：
   ```
   [ONLYOFFICE Callback] 收到回調
   [ONLYOFFICE Callback] 文檔已下載，大小: ...
   [ONLYOFFICE Callback] 文檔已上傳到 Supabase
   [ONLYOFFICE Callback] Template 已更新
   ```

6. 重新打開文檔，應該看到保存的變更

## 生產環境部署

在生產環境（有公開域名時），callback URL 會自動使用正確的域名，無需 localtunnel。

例如：
- 開發：`https://your-url.loca.lt/api/onlyoffice-callback`
- 生產：`https://your-domain.com/api/onlyoffice-callback`

## 故障排除

### 保存後沒有變更

檢查：
1. ONLYOFFICE 是否能訪問 callback URL
2. 瀏覽器 Network 面板中是否有到 `/api/onlyoffice-callback` 的請求
3. 伺服器日誌中是否有回調記錄

### Callback URL 錯誤

如果看到錯誤：
```
編輯器錯誤: {"errorCode":-4,"errorDescription":"下載失敗"}
```

可能原因：
- ONLYOFFICE 無法訪問文檔 URL
- 或無法訪問 callback URL

解決：
- 確保使用 localtunnel URL（開發環境）
- 確保 Supabase Storage 的文檔是公開可訪問的
- 如果 localtunnel 不穩定，可以嘗試 ngrok（需要註冊帳號）

## 目前限制

- 開發環境需要 tunnel 工具（localtunnel/ngrok）才能使用自動保存
- Localtunnel 的 URL 每次重啟都會改變
- 右上角的 [ SAVE ] 按鈕目前只是提示用戶使用編輯器內建的保存功能

## 未來改進

1. 實現右上角 [ SAVE ] 按鈕的功能（手動下載並上傳）
2. 添加保存狀態指示器
3. 支持版本歷史
4. 自動保存草稿
