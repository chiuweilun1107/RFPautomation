# Document Server 快速參考指南

## 基本資訊

- **伺服器**: 5.78.118.41 (Hetzner Cloud)
- **SSH**: `ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41`
- **容器名稱**: `onlyoffice-documentserver`
- **配置目錄**: `/opt/onlyoffice/`
- **服務端口**:
  - HTTP: 8080
  - HTTPS: 8443

---

## 常用命令

### 查看狀態
```bash
# 查看容器狀態
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker ps | grep onlyoffice"

# 健康檢查
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "curl -s http://localhost:8080/healthcheck"

# 查看服務狀態
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver supervisorctl status"
```

### 查看日誌
```bash
# 最近 100 行日誌
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker logs --tail 100 onlyoffice-documentserver"

# 實時日誌
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker logs -f onlyoffice-documentserver"

# 搜尋錯誤
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker logs --tail 500 onlyoffice-documentserver 2>&1 | grep -i error"
```

### 容器管理
```bash
# 重啟容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose restart"

# 停止容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose down"

# 啟動容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose up -d"

# 重新構建並啟動
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose up -d --force-recreate"
```

### 進入容器
```bash
# 進入容器 shell
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec -it onlyoffice-documentserver /bin/bash"

# 執行單個命令
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver <命令>"
```

---

## 常見問題排查

### 問題 1: 權限錯誤
**症狀**: "You are trying to perform an action you do not have rights for"

**排查**:
```bash
# 檢查快取目錄權限
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver ls -la /var/www/onlyoffice/documentserver/.cache"

# 檢查日誌中的權限錯誤
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker logs onlyoffice-documentserver 2>&1 | grep -i 'EACCES\|permission denied'"
```

**修復**:
```bash
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker exec onlyoffice-documentserver bash -c '
  mkdir -p /var/www/onlyoffice/documentserver/.cache/pkg &&
  chown -R ds:ds /var/www/onlyoffice/documentserver/.cache &&
  chmod -R 775 /var/www/onlyoffice/documentserver/.cache &&
  chown -R ds:ds /var/www/onlyoffice/Data
'"
```

### 問題 2: JWT 認證錯誤
**症狀**: "auth error: Error: secretOrPrivateKey must have a value"

**排查**:
```bash
# 檢查 JWT 環境變數
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver env | grep JWT"

# 檢查配置文件
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver cat /etc/onlyoffice/documentserver/local.json"
```

**修復**: 確保 `docker-compose.yml` 包含正確的 JWT 配置（參考完整報告）

### 問題 3: 服務未啟動
**症狀**: 健康檢查失敗，服務無法連接

**排查**:
```bash
# 檢查服務狀態
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver supervisorctl status"

# 檢查端口
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "netstat -tlnp | grep ':8080\|:8443'"
```

**修復**:
```bash
# 重啟服務
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver supervisorctl restart ds:docservice ds:converter"
```

### 問題 4: 磁碟空間不足
**排查**:
```bash
# 檢查磁碟使用
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "df -h"

# 檢查 Docker 磁碟使用
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "docker system df"

# 查找大文件
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "du -sh /var/lib/docker/volumes/* | sort -hr | head -10"
```

**清理**:
```bash
# 清理未使用的 Docker 資源
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker system prune -af --volumes"

# 清理舊日誌（保留最近 7 天）
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker exec onlyoffice-documentserver find /var/log/onlyoffice -type f -mtime +7 -delete"
```

---

## 性能監控

### 容器資源使用
```bash
# 查看即時資源使用
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker stats onlyoffice-documentserver --no-stream"

# 持續監控
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker stats onlyoffice-documentserver"
```

### 服務性能測試
```bash
# 測試健康檢查響應時間
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "time curl -s http://localhost:8080/healthcheck"

# 測試轉換 API
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "curl -X POST http://localhost:8080/ConvertService.ashx \
   -H 'Content-Type: application/json' \
   -d '{\"async\":false}'"
```

---

## 備份與恢復

### 備份資料
```bash
# 備份 Docker 卷
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker run --rm -v onlyoffice_document_data:/data -v /backup:/backup \
   alpine tar czf /backup/onlyoffice-data-$(date +%Y%m%d).tar.gz -C /data ."

# 備份配置
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "tar czf /tmp/onlyoffice-config-$(date +%Y%m%d).tar.gz /opt/onlyoffice/"

# 下載到本地
scp -i ~/.ssh/id_hetzner_migration \
  root@5.78.118.41:/backup/onlyoffice-data-*.tar.gz \
  ~/backups/
```

### 恢復資料
```bash
# 停止容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose down"

# 恢復卷資料
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker run --rm -v onlyoffice_document_data:/data -v /backup:/backup \
   alpine sh -c 'cd /data && tar xzf /backup/onlyoffice-data-YYYYMMDD.tar.gz'"

# 啟動容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose up -d"
```

---

## 自動化監控

### 設置監控腳本
```bash
# 在伺服器上設置 cron job
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "cat > /etc/cron.d/document-server-monitor << 'EOF'
# 每 15 分鐘檢查 Document Server 健康狀態
*/15 * * * * root /opt/monitoring/document-server-monitor.sh >> /var/log/document-server-monitor.log 2>&1
EOF"

# 上傳監控腳本
scp -i ~/.ssh/id_hetzner_migration \
  ./document-server-monitor.sh \
  root@5.78.118.41:/opt/monitoring/

# 設置執行權限
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "chmod +x /opt/monitoring/document-server-monitor.sh"
```

### 手動執行監控
```bash
# 從本地執行
./document-server-monitor.sh

# 從伺服器執行
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "/opt/monitoring/document-server-monitor.sh"
```

---

## API 測試範例

### 基本健康檢查
```bash
curl http://5.78.118.41:8080/healthcheck
```

### 文檔轉換測試（需要有效的文檔 URL）
```bash
curl -X POST http://5.78.118.41:8080/ConvertService.ashx \
  -H "Content-Type: application/json" \
  -d '{
    "async": false,
    "filetype": "docx",
    "key": "test-key",
    "outputtype": "pdf",
    "url": "https://example.com/document.docx"
  }'
```

### 協作編輯測試（需要配置 JWT）
```bash
# 如果啟用了 JWT，需要生成 token
# 參考: https://api.onlyoffice.com/editors/signature/
```

---

## 升級 Document Server

### 檢查更新
```bash
# 拉取最新版本
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker pull onlyoffice/documentserver:latest"
```

### 執行升級
```bash
# 1. 備份資料（重要！）
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker run --rm -v onlyoffice_document_data:/data -v /backup:/backup \
   alpine tar czf /backup/onlyoffice-data-before-upgrade-$(date +%Y%m%d).tar.gz -C /data ."

# 2. 停止並移除舊容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose down"

# 3. 拉取新版本
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker pull onlyoffice/documentserver:latest"

# 4. 啟動新容器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "cd /opt/onlyoffice && docker compose up -d"

# 5. 驗證
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 \
  "docker logs -f onlyoffice-documentserver"
```

---

## 安全最佳實踐

### 1. 啟用 JWT（生產環境）
編輯 `/opt/onlyoffice/docker-compose.yml`:
```yaml
environment:
  - JWT_ENABLED=true
  - JWT_SECRET=<使用 openssl rand -hex 32 生成>
  - JWT_HEADER=Authorization
  - JWT_IN_BODY=false
```

### 2. 啟用 HTTPS
配置 SSL 證書並使用 8443 端口

### 3. 限制網路存取
使用防火牆規則限制存取來源

### 4. 定期更新
每月檢查並更新到最新版本

### 5. 監控與告警
設置自動監控和告警通知

---

## 相關文檔

- **官方文檔**: https://helpcenter.onlyoffice.com/installation/docs-community-index.aspx
- **API 參考**: https://api.onlyoffice.com/editors/basic
- **Docker Hub**: https://hub.docker.com/r/onlyoffice/documentserver
- **故障排除**: https://helpcenter.onlyoffice.com/installation/docs-community-troubleshoot.aspx

---

## 緊急聯絡

如果遇到無法解決的問題：
1. 檢查完整報告: `DOCUMENT_SERVER_FIX_REPORT.md`
2. 執行監控腳本: `./document-server-monitor.sh`
3. 收集日誌並聯絡技術支援
