# OnlyOffice 部署檢查清單

## 快速開始

### 本地開發（立即可用）
```bash
# 1. 確認環境變數
grep NEXT_PUBLIC_ONLYOFFICE_API_URL frontend/.env.local

# 2. 啟動開發伺服器
cd frontend
npm run dev

# 3. 測試編輯器（訪問模板編輯頁面）
```

### 生產環境部署（推薦）
```bash
# 1. SSH 到伺服器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 2. 上傳腳本（在本地執行）
scp -i ~/.ssh/id_hetzner_migration scripts/*.sh root@5.78.118.41:/root/scripts/

# 3. 執行部署（在伺服器上執行）
cd /root/scripts
./setup-onlyoffice-cloudflare-tunnel.sh

# 4. 驗證（在伺服器上執行）
./verify-onlyoffice-setup.sh

# 5. 更新前端環境變數（在本地執行）
# 修改 frontend/.env.local:
# NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org

# 6. 重建前端（在本地執行）
cd frontend
npm run build
npm start
```

---

## 部署前檢查清單

### 伺服器環境
- [ ] Docker 已安裝
- [ ] OnlyOffice 容器正在運行
- [ ] 端口 8080 可訪問（本地測試）
- [ ] 防火牆規則已配置

### Cloudflare 配置
- [ ] Cloudflare 帳戶已設置
- [ ] 域名已添加到 Cloudflare（decaza.org）
- [ ] 可以登入 Cloudflare Dashboard

### 前端配置
- [ ] `.env.local` 文件存在
- [ ] 環境變數已配置
- [ ] `onlyoffice-config.ts` 模組存在
- [ ] 組件已更新使用統一配置

---

## 部署步驟詳解

### 步驟 1: 準備腳本
```bash
# 在本地執行
cd "/Users/chiuyongren/Desktop/AI dev"

# 檢查腳本
ls -lh scripts/*.sh

# 應該看到:
# - quick-deploy-onlyoffice.sh
# - setup-onlyoffice-cloudflare-tunnel.sh
# - verify-onlyoffice-setup.sh
```

### 步驟 2: 上傳到伺服器
```bash
# 創建目錄（在伺服器上）
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "mkdir -p /root/scripts"

# 上傳腳本（在本地）
scp -i ~/.ssh/id_hetzner_migration scripts/*.sh root@5.78.118.41:/root/scripts/

# 添加執行權限（在伺服器上）
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41 "chmod +x /root/scripts/*.sh"
```

### 步驟 3: 執行部署
```bash
# SSH 到伺服器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 執行安裝
cd /root/scripts
./setup-onlyoffice-cloudflare-tunnel.sh
```

**重要**：
- 第一次執行會要求登入 Cloudflare（瀏覽器驗證）
- 完成驗證後重新執行腳本
- 記錄 Tunnel ID（腳本會顯示）

### 步驟 4: 驗證部署
```bash
# 在伺服器上執行
./verify-onlyoffice-setup.sh

# 檢查輸出，確認所有檢查通過
```

### 步驟 5: 更新前端
```bash
# 在本地執行
cd frontend

# 編輯 .env.local
nano .env.local
# 修改: NEXT_PUBLIC_ONLYOFFICE_API_URL=https://onlyoffice.decaza.org

# 重建
npm run build

# 啟動生產伺服器
npm start
```

### 步驟 6: 測試
```bash
# 瀏覽器測試
# 1. 訪問: https://editor.decaza.org
# 2. 打開模板編輯頁面
# 3. 檢查開發者工具（Console）
# 4. 確認無 Mixed Content 錯誤

# 命令列測試（在伺服器上）
curl -I https://onlyoffice.decaza.org/web-apps/apps/api/documents/api.js
# 應該返回: HTTP/2 200
```

---

## 驗證檢查清單

### Docker 容器
```bash
# 檢查狀態
docker ps | grep onlyoffice

# 檢查日誌
docker logs onlyoffice-documentserver --tail 50

# 重啟容器（如需要）
docker restart onlyoffice-documentserver
```

### Cloudflare Tunnel
```bash
# 檢查服務
systemctl status cloudflared

# 檢查日誌
journalctl -u cloudflared -f

# 查看 Tunnel 資訊
cloudflared tunnel info onlyoffice-tunnel

# 重啟服務（如需要）
systemctl restart cloudflared
```

### DNS 解析
```bash
# 檢查 DNS
dig +short onlyoffice.decaza.org

# 應該返回 Cloudflare IP（104.x.x.x 或 172.x.x.x）
```

### HTTPS 訪問
```bash
# 測試主頁
curl -I https://onlyoffice.decaza.org

# 測試 API
curl -I https://onlyoffice.decaza.org/web-apps/apps/api/documents/api.js

# 檢查 SSL 憑證
echo | openssl s_client -connect onlyoffice.decaza.org:443 -servername onlyoffice.decaza.org 2>/dev/null | openssl x509 -noout -dates
```

### 前端整合
```bash
# 檢查環境變數
grep NEXT_PUBLIC_ONLYOFFICE_API_URL frontend/.env.local

# 檢查組件
grep -r "getOnlyOfficeApiScriptUrl" frontend/src/components/templates/
```

---

## 故障排除

### 問題 1: Cloudflared 安裝失敗
```bash
# 手動安裝
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# 驗證
cloudflared version
```

### 問題 2: Tunnel 連接失敗
```bash
# 檢查配置
cloudflared tunnel ingress validate

# 查看詳細日誌
journalctl -u cloudflared -n 100 --no-pager

# 重新創建 Tunnel
cloudflared tunnel delete onlyoffice-tunnel
cloudflared tunnel create onlyoffice-tunnel
```

### 問題 3: DNS 未解析
```bash
# 檢查 DNS 記錄
cloudflared tunnel route dns onlyoffice-tunnel onlyoffice.decaza.org

# 或在 Cloudflare Dashboard 手動添加
# Type: CNAME
# Name: onlyoffice
# Target: <TUNNEL_ID>.cfargotunnel.com
```

### 問題 4: 前端仍然載入失敗
```bash
# 清除 Next.js 緩存
cd frontend
rm -rf .next
npm run build

# 檢查環境變數
env | grep NEXT_PUBLIC_ONLYOFFICE_API_URL

# 重啟開發伺服器
npm run dev
```

### 問題 5: Mixed Content 錯誤
```bash
# 確認環境變數使用 HTTPS
grep NEXT_PUBLIC_ONLYOFFICE_API_URL frontend/.env.local
# 應該是: https://onlyoffice.decaza.org

# 檢查瀏覽器 Console
# 確認載入的 URL 是 HTTPS
```

---

## 回滾計劃

### 回滾到開發模式
```bash
# 1. 修改環境變數
# frontend/.env.local:
NEXT_PUBLIC_ONLYOFFICE_API_URL=http://5.78.118.41:8080

# 2. 重建
cd frontend
npm run build
npm run dev
```

### 停止 Cloudflare Tunnel
```bash
# 在伺服器上
systemctl stop cloudflared
systemctl disable cloudflared
```

### 移除 Tunnel
```bash
# 在伺服器上
cloudflared tunnel delete onlyoffice-tunnel
```

---

## 監控與維護

### 日常監控
```bash
# 每日檢查
./scripts/verify-onlyoffice-setup.sh

# 查看 Tunnel 狀態
systemctl status cloudflared

# 查看 OnlyOffice 日誌
docker logs onlyoffice-documentserver --tail 100
```

### 性能監控
```bash
# 檢查響應時間
curl -w "@curl-format.txt" -o /dev/null -s https://onlyoffice.decaza.org

# 創建 curl-format.txt:
cat > curl-format.txt <<EOF
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

### 定期維護
```bash
# 每週執行
# 1. 檢查容器狀態
docker ps -a

# 2. 清理舊日誌
docker logs onlyoffice-documentserver > /dev/null 2>&1

# 3. 檢查磁碟空間
df -h

# 4. 更新 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
```

---

## 安全最佳實踐

### 1. 限制訪問
```bash
# Cloudflare Dashboard → Security → WAF
# 添加防火牆規則限制訪問來源
```

### 2. 啟用日誌
```bash
# Cloudflare Dashboard → Analytics → Logs
# 啟用 Logpush 以監控訪問
```

### 3. 定期更新
```bash
# 更新 OnlyOffice
docker pull onlyoffice/documentserver:latest
docker stop onlyoffice-documentserver
docker rm onlyoffice-documentserver
# 重新創建容器

# 更新 cloudflared
cloudflared update
```

### 4. 備份配置
```bash
# 備份 Cloudflare Tunnel 配置
cp ~/.cloudflared/config.yml ~/.cloudflared/config.yml.backup

# 備份環境變數
cp frontend/.env.local frontend/.env.local.backup
```

---

## 相關資源

- **完整指南**: `ONLYOFFICE_CLOUDFLARE_TUNNEL_SETUP.md`
- **修復總結**: `ONLYOFFICE_FIX_SUMMARY.md`
- **部署腳本**: `scripts/setup-onlyoffice-cloudflare-tunnel.sh`
- **驗證腳本**: `scripts/verify-onlyoffice-setup.sh`
- **快速部署**: `scripts/quick-deploy-onlyoffice.sh`

---

## 支援聯絡

遇到問題時：
1. 執行驗證腳本獲取診斷資訊
2. 查看相關日誌文件
3. 參考故障排除章節
4. 查看 Cloudflare 和 OnlyOffice 官方文檔
