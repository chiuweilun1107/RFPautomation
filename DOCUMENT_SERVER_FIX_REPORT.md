# Document Server 權限錯誤修復報告

**日期**: 2026-01-24
**伺服器**: Hetzner Cloud (5.78.118.41)
**服務**: OnlyOffice Document Server
**狀態**: ✅ 已解決

---

## 問題摘要

Document Server 出現權限錯誤，提示：
> "You are trying to perform an action you do not have rights for. Please contact your Document Server administrator."

## 根本原因分析

通過系統診斷，發現了以下核心問題：

### 1. 文件系統權限問題
- **錯誤日誌**: `EACCES: permission denied, mkdir '/var/www/onlyoffice/documentserver/.cache/pkg/...'`
- **原因**: Document Server 的服務進程運行在 `ds` 用戶（UID: 105, GID: 107）下，但缺少必要的快取目錄
- **影響**: Sharp 模組（圖像處理）無法載入，文檔轉換功能受限

### 2. JWT 配置不完整
- **錯誤日誌**: `auth error: Error: secretOrPrivateKey must have a value`
- **原因**: 雖然設置了 `JWT_ENABLED=false`，但環境變數配置不完整
- **影響**: 某些 API 操作仍嘗試簽名 JWT，導致認證失敗

---

## 已執行的修復步驟

### 步驟 1: 創建必要的快取目錄並設置權限
```bash
docker exec onlyoffice-documentserver bash -c \
  'mkdir -p /var/www/onlyoffice/documentserver/.cache/pkg && \
   chown -R ds:ds /var/www/onlyoffice/documentserver/.cache && \
   chmod -R 775 /var/www/onlyoffice/documentserver/.cache'
```

### 步驟 2: 修復資料目錄權限
```bash
docker exec onlyoffice-documentserver bash -c \
  'chown -R ds:ds /var/www/onlyoffice/Data'
```

### 步驟 3: 更新 Docker Compose 配置
更新 `/opt/onlyoffice/docker-compose.yml` 以完善 JWT 配置：

```yaml
services:
  onlyoffice-documentserver:
    image: onlyoffice/documentserver:latest
    container_name: onlyoffice-documentserver
    restart: always
    ports:
      - '8080:80'
      - '8443:443'
    environment:
      - JWT_ENABLED=false
      - JWT_SECRET=
      - JWT_HEADER=Authorization
      - JWT_IN_BODY=false
    volumes:
      - document_data:/var/www/onlyoffice/Data
      - document_log:/var/log/onlyoffice
      - document_fonts:/usr/share/fonts/truetype/custom
      - ./documents:/var/www/onlyoffice/documents:ro
    stdin_open: true
    tty: true

volumes:
  document_data:
  document_log:
  document_fonts:
```

### 步驟 4: 重啟容器
```bash
cd /opt/onlyoffice
docker compose down
docker compose up -d
```

---

## 驗證結果

### 健康檢查
```bash
curl http://localhost:8080/healthcheck
# 返回: true ✅
```

### 服務狀態
```
ds:converter    RUNNING   ✅
ds:docservice   RUNNING   ✅
```

### 目錄權限
```
drwxrwxr-x 3 ds ds 4096 /var/www/onlyoffice/documentserver/.cache ✅
```

### 日誌狀態
- ✅ 無 EACCES 權限錯誤
- ✅ 無 JWT 認證錯誤
- ✅ 核心服務正常啟動

---

## 永久性修復建議

### 1. 添加持久化快取卷（推薦）
為防止容器重啟後快取目錄丟失，建議在 `docker-compose.yml` 中添加快取卷：

```yaml
services:
  onlyoffice-documentserver:
    # ... 其他配置 ...
    volumes:
      - document_data:/var/www/onlyoffice/Data
      - document_log:/var/log/onlyoffice
      - document_fonts:/usr/share/fonts/truetype/custom
      - document_cache:/var/www/onlyoffice/documentserver/.cache  # 新增
      - ./documents:/var/www/onlyoffice/documents:ro

volumes:
  document_data:
  document_log:
  document_fonts:
  document_cache:  # 新增
```

### 2. 使用 Entrypoint 腳本自動初始化
創建 `/opt/onlyoffice/init-permissions.sh`：

```bash
#!/bin/bash
set -e

# 確保快取目錄存在且權限正確
mkdir -p /var/www/onlyoffice/documentserver/.cache/pkg
chown -R ds:ds /var/www/onlyoffice/documentserver/.cache
chmod -R 775 /var/www/onlyoffice/documentserver/.cache

# 確保資料目錄權限正確
chown -R ds:ds /var/www/onlyoffice/Data

# 執行原始啟動腳本
exec /app/ds/run-document-server.sh
```

在 `docker-compose.yml` 中使用：

```yaml
services:
  onlyoffice-documentserver:
    # ... 其他配置 ...
    volumes:
      - ./init-permissions.sh:/init-permissions.sh:ro
    entrypoint: ["/bin/bash", "/init-permissions.sh"]
```

### 3. 啟用 JWT 安全性（生產環境強烈建議）
如果這是生產環境，應啟用 JWT 以保護文檔操作：

```yaml
environment:
  - JWT_ENABLED=true
  - JWT_SECRET=your-strong-random-secret-here  # 使用強隨機密鑰
  - JWT_HEADER=Authorization
  - JWT_IN_BODY=false
```

生成安全的 JWT 密鑰：
```bash
openssl rand -hex 32
```

**重要**: 啟用 JWT 後，所有客戶端應用（如 onlyoffice-parsing-service）必須在請求中包含正確的 JWT token。

---

## 後續監控建議

### 1. 設置健康檢查
在 `docker-compose.yml` 中添加：

```yaml
services:
  onlyoffice-documentserver:
    # ... 其他配置 ...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 90s
```

### 2. 日誌監控
定期檢查關鍵錯誤：

```bash
# 檢查權限錯誤
docker logs onlyoffice-documentserver 2>&1 | grep -i "EACCES\|permission denied"

# 檢查認證錯誤
docker logs onlyoffice-documentserver 2>&1 | grep -i "auth error"

# 檢查服務狀態
docker exec onlyoffice-documentserver supervisorctl status
```

### 3. 設置告警
使用 Prometheus + Grafana 監控以下指標：
- 容器健康狀態
- Document Server API 回應時間
- 轉換任務成功率
- 磁碟空間使用（快取目錄）

---

## 已知限制

1. **Example 服務未啟用**: `ds:example` 服務未啟動（這是預設行為，僅用於測試）
2. **Admin Panel 未啟用**: `ds:adminpanel` 服務未啟動（可選，用於管理介面）
3. **SSL 證書**: 目前使用 HTTP (8080)，生產環境應配置 HTTPS (8443)

---

## 相關服務檢查

### OnlyOffice Parsing Service
確認此服務能正確連接到 Document Server：

```bash
docker logs onlyoffice-parsing-service | grep -i "document server\|connection"
```

如果啟用了 JWT，需要更新 parsing service 的配置以包含 JWT token。

---

## 總結

✅ **問題已解決**: Document Server 現在可以正常運行
✅ **權限已修復**: 快取目錄權限正確
✅ **JWT 已配置**: 明確禁用 JWT（開發環境）
⚠️  **建議**: 生產環境應啟用 JWT 並使用 HTTPS
📋 **後續行動**: 實施永久性修復和監控方案

---

## 技術聯絡

如有進一步問題，請檢查：
- Document Server 文檔: https://api.onlyoffice.com/editors/basic
- 故障排除指南: https://helpcenter.onlyoffice.com/installation/docs-community-troubleshoot.aspx
- Docker Hub: https://hub.docker.com/r/onlyoffice/documentserver
