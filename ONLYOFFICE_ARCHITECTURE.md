# OnlyOffice 架構設計與安全改進

## 架構演進

### 1. 初始架構（不安全）

```
┌─────────────────────────────────────────────────────────────┐
│ 用戶瀏覽器                                                    │
│ https://editor.decaza.org (HTTPS ✓)                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ ⚠️ Mixed Content Error
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ OnlyOffice Document Server                                  │
│ http://5.78.118.41:8080 (HTTP ✗)                           │
│ - 無 SSL 憑證                                                │
│ - 直接暴露在公網                                              │
│ - 端口 8080 公開訪問                                          │
└─────────────────────────────────────────────────────────────┘
```

**問題**:
- 🔴 HTTPS 頁面載入 HTTP 資源（瀏覽器阻止）
- 🔴 缺少 SSL/TLS 加密
- 🔴 直接暴露 IP 和端口
- 🔴 無存取控制
- 🔴 易受 DDoS 攻擊

---

### 2. 目標架構（安全）

```
┌─────────────────────────────────────────────────────────────┐
│ 用戶瀏覽器                                                    │
│ https://editor.decaza.org (HTTPS ✓)                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS (安全連接)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare CDN                                              │
│ https://onlyoffice.decaza.org (HTTPS ✓)                    │
│ - 自動 SSL 憑證管理                                           │
│ - DDoS 防護                                                  │
│ - WAF（Web Application Firewall）                          │
│ - 快取加速                                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 加密 Tunnel
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Tunnel (cloudflared)                             │
│ - 零開放端口（Zero Trust）                                    │
│ - 端對端加密                                                  │
│ - 自動重連                                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ localhost (內部通信)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ OnlyOffice Document Server                                  │
│ http://localhost:8080 (內部 HTTP ✓)                        │
│ - 僅監聽本地端口                                              │
│ - 不暴露在公網                                                │
│ - 通過 Tunnel 安全訪問                                        │
└─────────────────────────────────────────────────────────────┘
```

**改進**:
- ✅ 全程 HTTPS 加密
- ✅ 自動 SSL 憑證管理
- ✅ 零開放端口（更安全）
- ✅ DDoS 防護
- ✅ 隱藏伺服器 IP

---

## 網路流量分析

### 請求流程

#### 1. 用戶載入編輯器
```
用戶瀏覽器
    │
    │ GET https://editor.decaza.org/templates/edit/123
    ↓
Next.js 前端
    │
    │ 渲染 <OnlyOfficeEditor> 組件
    │ 載入 <Script src="{NEXT_PUBLIC_ONLYOFFICE_API_URL}/api.js" />
    ↓
瀏覽器請求 OnlyOffice API
```

#### 2. OnlyOffice API 載入（修復前）
```
瀏覽器
    │
    │ GET http://5.78.118.41:8080/web-apps/apps/api/documents/api.js
    │ ❌ Mixed Content Error（HTTPS 頁面載入 HTTP 資源）
    ↓
請求被阻止
```

#### 3. OnlyOffice API 載入（修復後）
```
瀏覽器
    │
    │ GET https://onlyoffice.decaza.org/web-apps/apps/api/documents/api.js
    ↓
Cloudflare CDN
    │ ✓ SSL 憑證驗證
    │ ✓ DDoS 檢查
    │ ✓ 快取檢查
    ↓
Cloudflare Tunnel
    │ ✓ 加密 Tunnel 連接
    ↓
OnlyOffice Container (localhost:8080)
    │ ✓ 返回 api.js
    ↓
回傳到瀏覽器
    │ ✓ 初始化 window.DocsAPI
```

#### 4. 文檔編輯
```
瀏覽器
    │ new DocsAPI.DocEditor(config)
    ↓
WebSocket 連接建立
    │ wss://onlyoffice.decaza.org/websocket
    ↓
Cloudflare Tunnel（WebSocket 支援）
    │ ✓ 升級到 WebSocket
    ↓
OnlyOffice Container
    │ ✓ 實時協作編輯
```

---

## 安全層次分析

### 第 1 層：Cloudflare Edge
```
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Edge Network                                     │
│                                                             │
│ [DDoS 防護] → [WAF 規則] → [Bot 檢測] → [速率限制]          │
│                                                             │
│ 功能:                                                        │
│ - 自動阻止惡意流量                                            │
│ - IP 白名單/黑名單                                            │
│ - 地理位置過濾                                                │
│ - SSL/TLS 終止                                               │
└─────────────────────────────────────────────────────────────┘
```

### 第 2 層：Cloudflare Tunnel
```
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Tunnel (Zero Trust)                              │
│                                                             │
│ [身份驗證] → [加密通道] → [存取策略]                          │
│                                                             │
│ 功能:                                                        │
│ - 零開放端口（無需防火牆規則）                                │
│ - 端對端加密                                                  │
│ - 自動憑證輪換                                                │
│ - 審計日誌                                                    │
└─────────────────────────────────────────────────────────────┘
```

### 第 3 層：應用容器
```
┌─────────────────────────────────────────────────────────────┐
│ OnlyOffice Docker Container                                 │
│                                                             │
│ [容器隔離] → [資源限制] → [漏洞掃描]                          │
│                                                             │
│ 功能:                                                        │
│ - 容器級隔離                                                  │
│ - 資源配額（CPU、記憶體）                                      │
│ - 定期安全掃描                                                │
│ - 最小權限原則                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 環境配置管理

### 開發環境
```yaml
環境: 本地開發
前端: http://localhost:3000
OnlyOffice: http://5.78.118.41:8080

配置文件: frontend/.env.local
NEXT_PUBLIC_ONLYOFFICE_API_URL=http://5.78.118.41:8080

特點:
  - ✓ 快速迭代
  - ✓ 無需 SSL 配置
  - ⚠️ 不安全（僅開發）
  - ⚠️ Mixed Content 警告
```

### 測試環境
```yaml
環境: 測試伺服器
前端: https://test.decaza.org
OnlyOffice: https://onlyoffice-test.decaza.org

配置文件: frontend/.env.test
NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice-test.decaza.org

特點:
  - ✓ HTTPS 加密
  - ✓ 與生產環境一致
  - ✓ 可進行安全測試
```

### 生產環境
```yaml
環境: 生產伺服器
前端: https://editor.decaza.org
OnlyOffice: https://onlyoffice.decaza.org

配置文件: frontend/.env.production
NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org

特點:
  - ✅ 全程 HTTPS
  - ✅ Cloudflare 防護
  - ✅ 高可用性
  - ✅ 監控告警
```

---

## 災難復原計劃

### 場景 1: OnlyOffice 容器崩潰

```bash
# 檢測
docker ps | grep onlyoffice
# 容器未運行

# 復原
docker start onlyoffice-documentserver

# 驗證
curl http://localhost:8080/healthcheck
```

**RTO**: 2 分鐘
**RPO**: 0（無資料遺失）

### 場景 2: Cloudflare Tunnel 中斷

```bash
# 檢測
systemctl status cloudflared
# 服務未運行

# 復原
systemctl restart cloudflared

# 驗證
cloudflared tunnel info onlyoffice-tunnel
```

**RTO**: 1 分鐘
**RPO**: 0（無資料遺失）

### 場景 3: SSL 憑證問題

```bash
# 檢測
echo | openssl s_client -connect onlyoffice.decaza.org:443 2>/dev/null | openssl x509 -noout -dates
# 憑證過期或無效

# 復原（Cloudflare 自動管理）
# Cloudflare 會自動續期憑證
# 如需手動觸發，登入 Cloudflare Dashboard 重新部署 Tunnel
```

**RTO**: 自動（Cloudflare 自動續期）
**RPO**: 0

### 場景 4: DNS 解析失敗

```bash
# 檢測
dig +short onlyoffice.decaza.org
# 無返回或錯誤 IP

# 復原
cloudflared tunnel route dns onlyoffice-tunnel onlyoffice.decaza.org

# 或在 Cloudflare Dashboard 手動添加 CNAME 記錄
```

**RTO**: 5 分鐘（DNS 傳播時間）
**RPO**: 0

---

## 性能優化

### 1. Cloudflare 快取配置

```yaml
頁面規則: onlyoffice.decaza.org/web-apps/*
  - 快取級別: Standard
  - 邊緣快取 TTL: 2 小時
  - 瀏覽器快取 TTL: 4 小時

頁面規則: onlyoffice.decaza.org/cache/*
  - 快取級別: Cache Everything
  - 邊緣快取 TTL: 1 天
```

### 2. OnlyOffice 容器資源配置

```yaml
services:
  onlyoffice-documentserver:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### 3. 網路最佳化

```yaml
Cloudflare 設定:
  - HTTP/3 (QUIC): 啟用
  - Brotli 壓縮: 啟用
  - Auto Minify: 啟用 (JS, CSS)
  - 早期提示: 啟用
```

---

## 監控指標

### 1. 可用性監控

```bash
# OnlyOffice 健康檢查
curl -f https://onlyoffice.decaza.org/healthcheck || alert

# Cloudflare Tunnel 狀態
systemctl is-active cloudflared || alert
```

### 2. 性能監控

```bash
# 響應時間
curl -w "%{time_total}\n" -o /dev/null -s https://onlyoffice.decaza.org

# 目標: < 500ms
```

### 3. 安全監控

```bash
# 檢查開放端口
nmap -p- 5.78.118.41

# 預期: 只有 SSH (22)
# OnlyOffice (8080) 應該不可訪問（透過 Tunnel）
```

### 4. 資源監控

```bash
# Docker 容器資源使用
docker stats onlyoffice-documentserver

# 目標: CPU < 70%, Memory < 3GB
```

---

## 成本分析

### Cloudflare Tunnel（免費方案）
- ✅ 零成本
- ✅ 無限流量
- ✅ 自動 SSL 憑證
- ✅ 基礎 DDoS 防護

### OnlyOffice Community Edition
- ✅ 免費（自託管）
- ✅ 無用戶數限制
- ✅ 完整功能

### Hetzner VPS
- 💰 現有資源
- 💰 無額外成本

**總額外成本: $0/月**

---

## 總結

### 修復前
- 🔴 不安全（HTTP）
- 🔴 Mixed Content 錯誤
- 🔴 直接暴露伺服器
- 🔴 無防護措施

### 修復後
- ✅ 全程 HTTPS 加密
- ✅ 零信任架構（Zero Trust）
- ✅ 自動化憑證管理
- ✅ DDoS 防護
- ✅ 零額外成本
- ✅ 高可用性
- ✅ 易於維護

### 關鍵改進
1. **安全性**: 從 HTTP 升級到 HTTPS（企業級）
2. **架構**: 從直接暴露到零信任架構
3. **維護**: 從手動管理到自動化
4. **成本**: $0 額外成本
5. **性能**: Cloudflare 全球 CDN 加速
