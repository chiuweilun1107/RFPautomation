# 部署指南

## 🚀 部署到雲端伺服器 (5.78.118.41)

### 方法 1：Docker 部署（推薦）

```bash
# 1. 打包服務
cd "/Users/chiuyongren/Desktop/AI dev/onlyoffice-parsing-service"
tar -czf onlyoffice-parsing.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  .

# 2. 上傳到伺服器
scp -i ~/.ssh/id_hetzner_migration \
  onlyoffice-parsing.tar.gz \
  root@5.78.118.41:/opt/

# 3. SSH 到伺服器並部署
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 4. 解壓並部署
cd /opt
tar -xzf onlyoffice-parsing.tar.gz -C onlyoffice-parsing-service
cd onlyoffice-parsing-service

# 5. 構建並啟動
docker-compose up -d --build

# 6. 查看日誌
docker logs -f onlyoffice-parsing-service

# 7. 測試
curl http://localhost:8005/health
```

### 方法 2：直接運行（開發/測試）

```bash
# 1. 上傳代碼（同上）

# 2. SSH 到伺服器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 3. 安裝依賴
cd /opt/onlyoffice-parsing-service
npm install

# 4. 啟動服務
npm start

# 或使用 PM2（持久運行）
npm install -g pm2
pm2 start server.js --name onlyoffice-parsing
pm2 save
pm2 startup
```

## 🔧 配置

### 環境變數

在伺服器上創建 `/opt/onlyoffice-parsing-service/.env`:

```bash
PORT=8005
NODE_ENV=production
ONLYOFFICE_SERVER=localhost  # 同一台伺服器
SSH_KEY=/root/.ssh/id_hetzner_migration
```

### Nginx 反向代理（可選）

如果需要通過域名訪問：

```nginx
# /etc/nginx/sites-available/onlyoffice-parsing

server {
    listen 80;
    server_name parsing.yourdomain.com;

    location / {
        proxy_pass http://localhost:8005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 文件上傳大小限制
        client_max_body_size 100M;
    }
}
```

```bash
# 啟用配置
ln -s /etc/nginx/sites-available/onlyoffice-parsing /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 📊 監控與維護

### 查看服務狀態

```bash
# Docker 方式
docker ps | grep onlyoffice-parsing
docker logs onlyoffice-parsing-service

# PM2 方式
pm2 status
pm2 logs onlyoffice-parsing
```

### 重啟服務

```bash
# Docker
docker-compose restart

# PM2
pm2 restart onlyoffice-parsing
```

### 更新服務

```bash
# 1. 上傳新代碼
scp -i ~/.ssh/id_hetzner_migration onlyoffice-parsing.tar.gz root@5.78.118.41:/opt/

# 2. SSH 到伺服器
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41

# 3. 解壓並重啟
cd /opt/onlyoffice-parsing-service
tar -xzf ../onlyoffice-parsing.tar.gz
docker-compose up -d --build
```

## 🐛 故障排除

### 端口被占用

```bash
# 查找占用端口的進程
lsof -i :8005
netstat -tulnp | grep 8005

# 停止佔用的服務
kill <PID>
```

### SSH 連接問題

```bash
# 測試 SSH 連接
ssh -i /root/.ssh/id_hetzner_migration root@localhost "echo 'OK'"

# 檢查密鑰權限
chmod 600 /root/.ssh/id_hetzner_migration
```

### Docker 容器無法啟動

```bash
# 查看詳細錯誤
docker logs onlyoffice-parsing-service

# 進入容器調試
docker exec -it onlyoffice-parsing-service sh
```

## 🔐 安全建議

1. **限制訪問**: 使用防火牆限制 8005 端口只能內網訪問
   ```bash
   ufw allow from 10.0.0.0/8 to any port 8005
   ```

2. **HTTPS**: 生產環境使用 HTTPS
   ```bash
   certbot --nginx -d parsing.yourdomain.com
   ```

3. **定期更新**: 定期更新依賴和 Docker 鏡像
   ```bash
   npm update
   docker pull node:18-alpine
   ```

## 📈 性能優化

### 增加並發處理

在 `server.js` 中使用 cluster 模式：

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 原有的 app.listen 代碼
}
```

### 添加緩存

使用 Redis 緩存解析結果：

```javascript
const redis = require('redis');
const client = redis.createClient();

// 檢查緩存
const cacheKey = `parsed:${fileHash}`;
const cached = await client.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// 解析並緩存
const result = await parser.parseTemplate(...);
await client.setex(cacheKey, 3600, JSON.stringify(result));
```

## 📞 支援

遇到問題？
1. 查看日誌文件
2. 檢查 ONLYOFFICE Server 狀態
3. 測試 SSH 連接
4. 聯繫開發團隊
