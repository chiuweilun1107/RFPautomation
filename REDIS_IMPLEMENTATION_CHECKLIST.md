# Redis 性能優化 - 實施清單

**系統架構師 Leo** | 2026-01-26

---

## 前置準備

- [ ] 備份現有配置
  ```bash
  cp docker-compose.yml docker-compose.yml.backup
  cp frontend/src/lib/redis.ts frontend/src/lib/redis.ts.backup
  ```

- [ ] 確認 Node.js 環境
  ```bash
  node -v  # 應該 >= 16.0.0
  npm -v   # 應該 >= 8.0.0
  ```

- [ ] 確認 Docker 環境
  ```bash
  docker -v
  docker-compose -v  # 應該 >= 2.0.0
  ```

---

## 階段 1: 快速優化 (30 分鐘)

### 1.1 更新 docker-compose.yml

- [ ] 打開文件: `/docker-compose.yml`

- [ ] 找到 `redis:` 服務配置 (第 100 行左右)

- [ ] 替換整個 redis 部分:
  ```yaml
  redis:
    image: redis:7-alpine
    container_name: redis-local
    ports:
      - "6379:6379"
    command: >
      redis-server
      --maxmemory 1gb
      --maxmemory-policy volatile-lru
      --save ""
      --appendonly no
      --lazyfree-lazy-eviction yes
      --lazyfree-lazy-expire yes
      --slowlog-log-slower-than 10000
      --slowlog-max-len 128
    networks:
      - rfp-network
    restart: unless-stopped
    healthcheck:
      test: [ "CMD", "redis-cli", "ping" ]
      interval: 10s
      timeout: 5s
      retries: 3
  ```

- [ ] 驗證語法
  ```bash
  docker-compose config | grep -A 15 "redis:"
  ```

### 1.2 優化 Node.js Redis 客戶端

- [ ] 打開文件: `/frontend/src/lib/redis.ts`

- [ ] 替換為優化版本:
  ```typescript
  import Redis from 'ioredis';

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');

  const globalForRedis = global as unknown as { redis: Redis };

  export const redis =
      globalForRedis.redis ||
      new Redis({
          host: redisHost,
          port: redisPort,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          connectTimeout: 5000,
          commandTimeout: 5000,
          keepAlive: 30000,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          lazyConnect: false,
      });

  redis.on('connect', () => {
      console.log('[Redis] Connected');
  });

  redis.on('error', (err) => {
      console.error('[Redis] Error:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redis = redis;
  }

  export default redis;
  ```

- [ ] 驗證文件保存
  ```bash
  head -20 frontend/src/lib/redis.ts
  ```

### 1.3 重啟 Redis 容器

- [ ] 停止現有服務
  ```bash
  docker-compose down
  ```

- [ ] 驗證容器停止
  ```bash
  docker-compose ps
  ```

- [ ] 啟動 Redis
  ```bash
  docker-compose up -d redis
  ```

- [ ] 檢查日誌
  ```bash
  docker-compose logs redis --tail 20
  # 預期看到: "Ready to accept connections"
  ```

### 1.4 驗證連接

- [ ] 測試 Redis 連接
  ```bash
  docker-compose exec redis redis-cli ping
  # 預期輸出: PONG
  ```

- [ ] 檢查配置生效
  ```bash
  docker-compose exec redis redis-cli config get maxmemory
  # 預期: 1073741824 (1GB in bytes)
  ```

- [ ] 檢查淘汰策略
  ```bash
  docker-compose exec redis redis-cli config get maxmemory-policy
  # 預期: volatile-lru
  ```

---

## 階段 2: 序列化優化 (20 分鐘)

### 2.1 安裝 MessagePack

- [ ] 進入前端目錄
  ```bash
  cd frontend
  ```

- [ ] 安裝依賴
  ```bash
  npm install msgpackr --save
  ```

- [ ] 驗證安裝
  ```bash
  npm list msgpackr
  # 預期: msgpackr@^1.x.x
  ```

### 2.2 創建序列化模塊

- [ ] 新建文件: `/frontend/src/lib/redis-serializer.ts`

- [ ] 複製內容:
  ```typescript
  import { pack, unpack } from 'msgpackr';

  export const redisSerializer = {
      serialize: (value: any) => {
          try {
              const buffer = pack(value);
              return Buffer.from(buffer).toString('base64');
          } catch (e) {
              console.error('Serialization error:', e);
              return JSON.stringify(value);
          }
      },

      deserialize: (value: string) => {
          try {
              return unpack(Buffer.from(value, 'base64'));
          } catch (e) {
              console.error('Deserialization error:', e);
              return JSON.parse(value);
          }
      },
  };

  export const redisGet = async (key: string) => {
      const { redis } = require('./redis');
      const raw = await redis.get(key);
      return raw ? redisSerializer.deserialize(raw) : null;
  };

  export const redisSet = async (key: string, value: any, exSeconds?: number) => {
      const { redis } = require('./redis');
      const serialized = redisSerializer.serialize(value);
      if (exSeconds) {
          return redis.set(key, serialized, 'EX', exSeconds);
      }
      return redis.set(key, serialized);
  };
  ```

- [ ] 驗證文件
  ```bash
  ls -la frontend/src/lib/redis-serializer.ts
  ```

### 2.3 更新 API 層使用

- [ ] 編輯文件: `/frontend/src/app/api/projects/accelerated/route.ts`

- [ ] 替換導入:
  ```typescript
  import { redisGet, redisSet } from '@/lib/redis-serializer';
  ```

- [ ] 更新 GET 部分 (替換舊的 redis.get/set):
  ```typescript
  // 使用新的序列化函數
  const cachedProjects = await redisGet(cacheKey);
  if (cachedProjects) {
      return NextResponse.json({ data: cachedProjects, source: 'cache' });
  }

  // ... DB 查詢 ...

  // 使用隨機 TTL 避免同時過期
  const jitterTTL = 300 + Math.floor(Math.random() * 60);
  await redisSet(cacheKey, data, jitterTTL);
  ```

- [ ] 驗證文件編譯
  ```bash
  cd frontend && npm run build
  # 應該編譯成功
  ```

---

## 階段 3: 防穿透 & 防雪崩 (1-2 小時)

### 3.1 集成完整 Redis 管理系統

- [ ] 複製文件: 將 `redis-optimized.ts` 複製到 `/frontend/src/lib/`
  ```bash
  cp redis-optimized.ts frontend/src/lib/redis-optimized.ts
  ```

- [ ] 驗證文件
  ```bash
  head -50 frontend/src/lib/redis-optimized.ts
  ```

### 3.2 更新 API 使用完整防護

- [ ] 編輯: `/frontend/src/app/api/projects/accelerated/route.ts`

- [ ] 更新導入:
  ```typescript
  import { RedisManager } from '@/lib/redis-optimized';
  ```

- [ ] 添加全局初始化 (文件頂部):
  ```typescript
  const redisManager = new RedisManager();
  const cache = redisManager.getCache();
  ```

- [ ] 更新 GET 函數完整實現:
  ```typescript
  export async function GET(req: NextRequest) {
      try {
          const { searchParams } = new URL(req.url);
          const shouldRefresh = searchParams.get('refresh') === 'true';

          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
              return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const cacheKey = `projects_list:${user.id}`;

          if (shouldRefresh) {
              await cache.delete(cacheKey);
          }

          // 使用 getWithLock 自動防穿透 + 防雪崩
          const projects = await cache.getWithLock(
              cacheKey,
              async () => {
                  const { data, error } = await supabase
                      .from('projects')
                      .select('*, project_assessments(*)')
                      .order('updated_at', { ascending: false });

                  if (error) throw error;
                  return data;
              },
              {
                  ttl: 300,           // 5 分鐘
                  nullTtl: 60,        // 空結果快取 1 分鐘
                  enableJitter: true, // TTL 隨機抖動
              }
          );

          return NextResponse.json({
              data: projects || [],
              source: projects ? 'cache' : 'supabase',
          });
      } catch (error: any) {
          console.error('Error:', error);
          return NextResponse.json(
              { error: error.message },
              { status: 500 }
          );
      }
  }
  ```

- [ ] 驗證編譯
  ```bash
  cd frontend && npm run build
  ```

### 3.3 測試防穿透機制

- [ ] 快速刷新 5 次同一查詢 (模擬穿透)
  ```bash
  for i in {1..5}; do
    curl "http://localhost:3000/api/projects/accelerated" \
      -H "Authorization: Bearer YOUR_TOKEN"
    sleep 0.1
  done
  ```

- [ ] 檢查日誌 (應該只有 1 次 DB 查詢)
  ```bash
  docker-compose logs frontend | grep "projects_list"
  # 預期: 1 個 "Cache Miss" + 4 個 "Waiting"
  ```

---

## 階段 4: 監控與告警 (1-2 小時)

### 4.1 啟動 Redis 監控容器

- [ ] 添加 redis-exporter 到 docker-compose.yml
  ```yaml
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: redis:6379
    depends_on:
      - redis
    networks:
      - rfp-network
    restart: unless-stopped
  ```

- [ ] 啟動 exporter
  ```bash
  docker-compose up -d redis-exporter
  ```

- [ ] 驗證指標收集
  ```bash
  curl http://localhost:9121/metrics | grep redis_
  ```

### 4.2 創建監控初始化模塊

- [ ] 新建: `/frontend/src/lib/redis-monitoring.ts`
  ```typescript
  import { RedisManager } from './redis-optimized';

  export function initRedisMonitoring() {
      if (process.env.NODE_ENV !== 'production') {
          const redisManager = new RedisManager();
          const monitor = redisManager.getMonitor();

          console.log('[Redis] Starting monitoring...');
          monitor.startMonitoring(60000);  // 每 60 秒
      }
  }
  ```

- [ ] 在應用啟動時初始化 (編輯 `frontend/src/app/layout.tsx`):
  ```typescript
  import { initRedisMonitoring } from '@/lib/redis-monitoring';

  // 在組件外部執行
  if (typeof window === 'undefined') {
      initRedisMonitoring();
  }

  export default function RootLayout({ children }: { children: React.ReactNode }) {
      return <html>{children}</html>;
  }
  ```

### 4.3 驗證監控工作

- [ ] 啟動前端
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] 檢查監控日誌
  ```bash
  docker-compose logs frontend | grep "Redis"
  # 預期: "[Redis] Starting monitoring..."
  # 預期: "[Monitor] Redis Health OK"
  ```

- [ ] 訪問 Prometheus 指標
  ```bash
  curl http://localhost:9121/metrics | head -20
  ```

---

## 驗收與測試

### 基礎功能驗收

- [ ] Redis 連接正常
  ```bash
  docker-compose exec redis redis-cli ping
  ```

- [ ] 配置生效
  ```bash
  docker-compose exec redis redis-cli config get maxmemory-policy
  ```

- [ ] 應用啟動正常
  ```bash
  docker-compose logs frontend | tail -20
  ```

### 性能驗證

- [ ] 緩存命中測試
  ```bash
  docker-compose exec redis redis-cli info stats | grep keyspace
  # 命中率應該逐漸上升 > 80%
  ```

- [ ] 延遲測試
  ```bash
  docker-compose exec redis redis-benchmark -h redis -c 10 -n 1000
  # 預期: latency < 5ms
  ```

- [ ] 內存使用
  ```bash
  docker-compose exec redis redis-cli info memory | grep used_memory_human
  # 應該 < 1GB
  ```

### 防護機制驗證

- [ ] 防穿透測試 (快速查詢 5 次)
  ```bash
  # 查看日誌應該只有 1 次 DB 查詢
  docker-compose logs frontend | grep "Cache"
  ```

- [ ] 防雪崩驗證 (查看 TTL 隨機抖動)
  ```bash
  docker-compose exec redis redis-cli TTL projects_list:*
  # 多個查詢的 TTL 應該不同
  ```

---

## 監控指標清單

### 每小時檢查

- [ ] Redis 連接狀態
  ```bash
  docker-compose exec redis redis-cli ping
  ```

- [ ] 命中率
  ```bash
  docker-compose exec redis redis-cli info stats | grep keyspace_hits
  ```

- [ ] 內存使用
  ```bash
  docker-compose exec redis redis-cli info memory | grep used_memory_human
  ```

### 每天檢查

- [ ] 完整日誌分析
  ```bash
  docker-compose logs redis --tail 100 | grep -i error
  ```

- [ ] 慢查詢檢查
  ```bash
  docker-compose exec redis redis-cli slowlog get 10
  ```

- [ ] 監控告警
  ```bash
  docker-compose logs frontend | grep -i "warning\|error"
  ```

### 每周檢查

- [ ] 性能基準測試
  ```bash
  docker-compose exec redis redis-benchmark -h redis -p 6379 -c 50 -n 10000
  ```

- [ ] 內存碎片率
  ```bash
  docker-compose exec redis redis-cli info memory | grep fragmentation
  ```

- [ ] 連接數變化趨勢
  ```bash
  docker-compose exec redis redis-cli client list | wc -l
  ```

---

## 故障排除

### 連接超時

症狀: `connect ECONNREFUSED`

- [ ] 檢查 Redis 是否運行
  ```bash
  docker-compose ps redis
  ```

- [ ] 查看 Redis 日誌
  ```bash
  docker-compose logs redis --tail 50
  ```

- [ ] 重啟 Redis
  ```bash
  docker-compose restart redis
  ```

### 內存溢出

症狀: `OOM command not allowed`

- [ ] 檢查內存使用
  ```bash
  docker-compose exec redis redis-cli info memory
  ```

- [ ] 檢查過期鑰匙
  ```bash
  docker-compose exec redis redis-cli info stats | grep expired_keys
  ```

- [ ] 增加 maxmemory (編輯 docker-compose.yml)

### 命中率低

症狀: Hit rate < 70%

- [ ] 檢查 TTL 設置
  ```bash
  docker-compose exec redis redis-cli TTL your_cache_key
  ```

- [ ] 檢查緩存鑰匙設計
  ```bash
  docker-compose exec redis redis-cli keys "*"
  ```

- [ ] 增加 TTL 或改進緩存策略

---

## 回滾程序

如果出現嚴重問題:

- [ ] 停止所有服務
  ```bash
  docker-compose down
  ```

- [ ] 恢復備份文件
  ```bash
  cp docker-compose.yml.backup docker-compose.yml
  cp frontend/src/lib/redis.ts.backup frontend/src/lib/redis.ts
  ```

- [ ] 啟動舊版本
  ```bash
  docker-compose up -d
  ```

- [ ] 驗證恢復
  ```bash
  docker-compose logs redis | tail -20
  ```

---

## 最終簽核

- [ ] 所有配置已更新
- [ ] 容器已重啟且健康
- [ ] 應用啟動正常
- [ ] 緩存功能正常 (命中率 > 80%)
- [ ] 監控正常工作
- [ ] 無錯誤日誌
- [ ] 性能指標達標 (延遲 < 20ms)

**簽名**: ________________  **日期**: __________

---

**系統架構師 Leo**
**2026-01-26**

