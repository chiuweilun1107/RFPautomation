# OnlyOffice SSL/HTTPS 問題修復總結

## 問題診斷

### 錯誤症狀
1. **Mixed Content Error**: HTTPS 前端頁面無法載入 HTTP OnlyOffice API
2. **SSL Protocol Error**: 直接訪問 `http://5.78.118.41:8080` 沒有 SSL 憑證
3. **載入失敗**: 瀏覽器拒絕載入不安全的腳本

### 根本原因
- 前端硬編碼使用 HTTP IP 地址：`http://5.78.118.41:8080`
- 伺服器缺少反向代理配置（無 Nginx/Caddy）
- 端口 80/443 未監聽，無法提供 HTTPS 服務
- OnlyOffice 容器直接暴露在公網，缺少 HTTPS 終止層

---

## 已實施的修復

### 1. 環境變數配置 ✅
**文件**: `frontend/.env.local`

添加環境變數：
```bash
NEXT_PUBLIC_ONLYOFFICE_API_URL=http://5.78.118.41:8080
# 生產環境改為: https://onlyoffice.decaza.org
```

### 2. 統一配置模組 ✅
**文件**: `frontend/src/lib/onlyoffice-config.ts`

創建統一配置工具：
- `getOnlyOfficeApiUrl()`: 獲取 API URL
- `getOnlyOfficeApiScriptUrl()`: 獲取 Script URL
- `isOnlyOfficeSecure()`: 檢查是否使用 HTTPS
- `getOnlyOfficeConfigSummary()`: 獲取配置摘要

### 3. 更新組件 ✅
**已更新的文件**:
- `frontend/src/components/templates/OnlyOfficeEditor.tsx`
- `frontend/src/components/templates/OnlyOfficeEditorWithUpload.tsx`

**變更**:
```typescript
// 舊版（硬編碼）
src="http://5.78.118.41:8080/web-apps/apps/api/documents/api.js"

// 新版（動態配置）
import { getOnlyOfficeApiScriptUrl } from '@/lib/onlyoffice-config';
src={getOnlyOfficeApiScriptUrl()}
```

### 4. 部署腳本 ✅
**文件**:
- `scripts/setup-onlyoffice-cloudflare-tunnel.sh`: 自動化部署 Cloudflare Tunnel
- `scripts/verify-onlyoffice-setup.sh`: 驗證配置和診斷問題

### 5. 文檔 ✅
**文件**: `ONLYOFFICE_CLOUDFLARE_TUNNEL_SETUP.md`

完整的部署指南和故障排除手冊

---

## 下一步操作

### 選項 A：立即開發測試（已可用）

當前配置允許在開發環境中繼續工作：

```bash
cd frontend
npm run dev
```

**注意**:
- 仍使用 HTTP（不安全）
- 僅適用於本地開發
- 瀏覽器可能顯示安全警告

### 選項 B：部署 Cloudflare Tunnel（推薦生產環境）

#### 步驟 1: 執行部署腳本
```bash
# SSH 到伺服器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 上傳並執行腳本
chmod +x scripts/setup-onlyoffice-cloudflare-tunnel.sh
./scripts/setup-onlyoffice-cloudflare-tunnel.sh
```

#### 步驟 2: 更新環境變數
修改 `frontend/.env.local`:
```bash
NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org
```

#### 步驟 3: 重建前端
```bash
cd frontend
npm run build
npm start
```

#### 步驟 4: 驗證
```bash
# 在伺服器上執行
./scripts/verify-onlyoffice-setup.sh
```

---

## 驗證清單

### 開發環境
- [ ] 環境變數已配置
- [ ] 前端可以啟動
- [ ] OnlyOffice 編輯器可以載入（忽略安全警告）
- [ ] 可以打開和編輯文檔

### 生產環境
- [ ] Cloudflare Tunnel 已部署
- [ ] DNS 記錄已配置（onlyoffice.decaza.org）
- [ ] HTTPS 訪問正常
- [ ] 前端環境變數已更新為 HTTPS URL
- [ ] 編輯器可以正常載入
- [ ] 無 Mixed Content 錯誤
- [ ] SSL 憑證有效

---

## 故障排除

### 問題 1: 前端仍然使用 HTTP URL

**檢查**:
```bash
grep NEXT_PUBLIC_ONLYOFFICE_API_URL frontend/.env.local
```

**修復**:
```bash
echo "NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org" >> frontend/.env.local
```

### 問題 2: Cloudflare Tunnel 未連接

**檢查**:
```bash
systemctl status cloudflared
journalctl -u cloudflared -f
```

**修復**:
```bash
systemctl restart cloudflared
```

### 問題 3: DNS 未解析

**檢查**:
```bash
dig +short onlyoffice.decaza.org
```

**修復**:
- 等待 DNS 傳播（最多 5 分鐘）
- 檢查 Cloudflare Dashboard → DNS 記錄

### 問題 4: 編輯器仍然載入失敗

**檢查**:
1. 瀏覽器開發者工具 → Console
2. 查看具體錯誤訊息

**修復**:
```bash
# 檢查 OnlyOffice 容器
docker logs onlyoffice-documentserver

# 重啟容器
docker restart onlyoffice-documentserver

# 驗證配置
./scripts/verify-onlyoffice-setup.sh
```

---

## 技術細節

### 架構對比

#### 修復前（不安全）
```
用戶瀏覽器 (HTTPS) → editor.decaza.org
     ↓ (Mixed Content Error)
直接訪問 (HTTP) → 5.78.118.41:8080
```

#### 修復後（安全）
```
用戶瀏覽器 (HTTPS) → editor.decaza.org
     ↓
Cloudflare CDN (HTTPS) → onlyoffice.decaza.org
     ↓
Cloudflare Tunnel (加密通道)
     ↓
OnlyOffice Container (localhost:8080)
```

### 安全改進
1. ✅ 全程 HTTPS 加密
2. ✅ 自動 SSL 憑證管理
3. ✅ 零開放端口（Tunnel 模式）
4. ✅ Cloudflare DDoS 防護
5. ✅ 環境變數管理（開發/生產分離）

---

## 相關文件

- **完整部署指南**: `ONLYOFFICE_CLOUDFLARE_TUNNEL_SETUP.md`
- **部署腳本**: `scripts/setup-onlyoffice-cloudflare-tunnel.sh`
- **驗證腳本**: `scripts/verify-onlyoffice-setup.sh`
- **配置模組**: `frontend/src/lib/onlyoffice-config.ts`
- **環境變數**: `frontend/.env.local`

---

## 支援

如遇到問題，請：
1. 執行驗證腳本：`./scripts/verify-onlyoffice-setup.sh`
2. 查看完整指南：`ONLYOFFICE_CLOUDFLARE_TUNNEL_SETUP.md`
3. 檢查容器日誌：`docker logs onlyoffice-documentserver`
4. 查看 Tunnel 日誌：`journalctl -u cloudflared -f`
