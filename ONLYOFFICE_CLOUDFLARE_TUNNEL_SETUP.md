# OnlyOffice Cloudflare Tunnel 部署指南

## 問題診斷總結

### 當前錯誤
1. **Mixed Content Error**: HTTPS 前端頁面載入 HTTP OnlyOffice API
2. **SSL Protocol Error**: 直接訪問 `http://5.78.118.41:8080` 沒有 SSL 憑證
3. **架構缺陷**: 缺少 HTTPS 終止層

### 根本原因
- 前端硬編碼使用 HTTP IP 地址訪問 OnlyOffice
- 伺服器缺少反向代理配置
- 端口 80/443 未監聽，無法提供 HTTPS 服務

---

## 解決方案：Cloudflare Tunnel

### 架構設計

```
用戶瀏覽器 (HTTPS)
    ↓
Cloudflare CDN (HTTPS)
    ↓
Cloudflare Tunnel (cloudflared daemon)
    ↓
OnlyOffice Container (localhost:8080)
```

### 優勢
- ✅ 自動管理 SSL 憑證
- ✅ 零開放端口（更安全）
- ✅ 自動 HTTPS 重定向
- ✅ 內建 DDoS 防護
- ✅ 無需手動配置 Nginx/Caddy

---

## 實施步驟

### 步驟 1：安裝 Cloudflare Tunnel (cloudflared)

```bash
# SSH 到伺服器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 下載並安裝 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# 驗證安裝
cloudflared version
```

### 步驟 2：驗證 Cloudflare 帳戶

```bash
# 登入 Cloudflare（會打開瀏覽器）
cloudflared tunnel login
```

**重要**：這會在 `~/.cloudflared/cert.pem` 創建憑證

### 步驟 3：創建 Tunnel

```bash
# 創建名為 onlyoffice-tunnel 的 tunnel
cloudflared tunnel create onlyoffice-tunnel

# 記錄 Tunnel ID（類似 a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6）
```

### 步驟 4：配置 Tunnel

創建配置文件 `/root/.cloudflared/config.yml`：

```yaml
tunnel: <YOUR_TUNNEL_ID>  # 替換為步驟 3 的 Tunnel ID
credentials-file: /root/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  # OnlyOffice Document Server
  - hostname: onlyoffice.decaza.org
    service: http://localhost:8080
    originRequest:
      noTLSVerify: true

  # 其他服務（可選）
  - hostname: n8n.decaza.org
    service: http://localhost:5678

  # Catch-all 規則（必須）
  - service: http_status:404
```

### 步驟 5：設置 DNS 記錄

```bash
# 將 Tunnel 關聯到域名
cloudflared tunnel route dns onlyoffice-tunnel onlyoffice.decaza.org

# 如需其他域名
cloudflared tunnel route dns onlyoffice-tunnel n8n.decaza.org
```

### 步驟 6：啟動 Tunnel

```bash
# 測試配置
cloudflared tunnel run onlyoffice-tunnel

# 如果正常，按 Ctrl+C 停止，然後安裝為系統服務
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared

# 檢查狀態
systemctl status cloudflared
```

### 步驟 7：更新前端配置

修改 `frontend/src/components/templates/OnlyOfficeEditor.tsx`：

```typescript
// 從
src="http://5.78.118.41:8080/web-apps/apps/api/documents/api.js"

// 改為
src="https://onlyoffice.decaza.org/web-apps/apps/api/documents/api.js"
```

**或者使用環境變數**（推薦）：

在 `frontend/.env.local` 添加：
```
NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org
```

在組件中：
```typescript
const apiUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://5.78.118.41:8080';

<Script
  src={`${apiUrl}/web-apps/apps/api/documents/api.js`}
  // ...
/>
```

---

## 驗證步驟

### 1. 檢查 Tunnel 狀態
```bash
systemctl status cloudflared
cloudflared tunnel info onlyoffice-tunnel
```

### 2. 測試 HTTPS 訪問
```bash
curl -I https://onlyoffice.decaza.org/web-apps/apps/api/documents/api.js
# 應該返回 200 OK
```

### 3. 瀏覽器測試
訪問：https://onlyoffice.decaza.org

### 4. 前端整合測試
啟動前端開發伺服器，測試編輯器載入

---

## 故障排除

### Tunnel 無法啟動
```bash
# 查看日誌
journalctl -u cloudflared -f

# 檢查配置
cloudflared tunnel ingress validate
```

### DNS 未生效
- 等待 DNS 傳播（最多 5 分鐘）
- 檢查 Cloudflare Dashboard → DNS 記錄
- 確認記錄類型為 CNAME，指向 `<TUNNEL_ID>.cfargotunnel.com`

### OnlyOffice 無法訪問
```bash
# 檢查 Docker 容器
docker ps | grep onlyoffice

# 檢查容器日誌
docker logs onlyoffice-documentserver

# 測試本地訪問
curl http://localhost:8080/web-apps/apps/api/documents/api.js
```

---

## 方案 B：傳統反向代理（備選）

如果不想使用 Cloudflare Tunnel，可以使用 Nginx + Let's Encrypt：

### 步驟 1：安裝 Nginx
```bash
apt update
apt install nginx certbot python3-certbot-nginx -y
```

### 步驟 2：配置 Nginx
創建 `/etc/nginx/sites-available/onlyoffice`：

```nginx
server {
    listen 80;
    server_name onlyoffice.decaza.org;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支援
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 步驟 3：啟用並獲取 SSL 憑證
```bash
ln -s /etc/nginx/sites-available/onlyoffice /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 獲取 Let's Encrypt 憑證
certbot --nginx -d onlyoffice.decaza.org
```

### 步驟 4：配置 Cloudflare
- Cloudflare Dashboard → DNS → 添加 A 記錄
- Name: `onlyoffice`
- IPv4: `5.78.118.41`
- Proxy status: 灰雲（DNS Only）或橙雲（Proxied）

---

## 推薦配置

1. **開發環境**：直接使用 IP（已接受風險）
2. **測試/生產**：使用 Cloudflare Tunnel（推薦）
3. **完全自主控制**：使用 Nginx + Let's Encrypt

---

## 下一步

1. **即時修復**：更新前端配置使用環境變數
2. **長期方案**：實施 Cloudflare Tunnel
3. **監控**：添加 OnlyOffice 健康檢查
4. **備份**：配置 OnlyOffice 資料備份策略
