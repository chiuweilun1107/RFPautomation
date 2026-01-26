# Redis 性能優化 - 快速實施指南

**系統架構師 Leo** | 2026-01-26

---

## 30 分鐘快速優化

### 第 1 步: 更新 Docker Compose 配置 (5 分鐘)

```bash
# 1. 備份當前配置
cp docker-compose.yml docker-compose.yml.backup

# 2. 查看當前 Redis 配置
grep -A 10 "^  redis:" docker-compose.yml
```

**用新配置替換 Redis 部分**:

編輯 `/docker-compose.yml`，找到 `redis:` 部分，替換為:

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

### 第 2 步: 優化 Node.js Redis 客戶端 (10 分鐘)

編輯 `/frontend/src/lib/redis.ts`:

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
        // 新增優化配置
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 5000,
        commandTimeout: 5000,
        keepAlive: 30000,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        lazyConnect: false,
    });

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err));

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

export default redis;
```

### 第 3 步: 重啟 Redis 容器 (5 分鐘)

```bash
# 1. 停止現有容器
docker-compose down

# 2. 啟動新配置
docker-compose up -d redis

# 3. 驗證狀態
docker-compose logs redis

# 4. 測試連接
docker-compose exec redis redis-cli ping
# 預期輸出: PONG
```

### 第 4 步: 驗證優化效果 (10 分鐘)

```bash
# 1. 檢查 Redis 信息
docker-compose exec redis redis-cli info stats

# 預期看到:
# - connected_clients: 連接數
# - keyspace_hits: 命中次數
# - keyspace_misses: 未命中次數

# 2. 計算命中率
docker-compose exec redis redis-cli info stats | grep keyspace

# 命中率應該 > 70%

# 3. 檢查內存使用
docker-compose exec redis redis-cli info memory

# 4. 查看慢查詢 (用來診斷性能問題)
docker-compose exec redis redis-cli slowlog get 5
```

---

## 階段 2: 序列化優化 (20 分鐘)

### 安裝 MessagePack

```bash
cd frontend
npm install msgpackr --save
```

### 創建序列化模塊

新建 `/frontend/src/lib/redis-serializer.ts`:

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

### 更新緩存 API

編輯 `/frontend/src/app/api/projects/accelerated/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { redisGet, redisSet } from '@/lib/redis-serializer';
import { NextResponse, NextRequest } from 'next/server';

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

        // 1. 嘗試從快取獲取
        if (!shouldRefresh) {
            const cachedProjects = await redisGet(cacheKey);
            if (cachedProjects) {
                console.log('✅ Cache Hit');
                return NextResponse.json({ data: cachedProjects, source: 'cache' });
            }
        }

        // 2. 從 DB 查詢
        console.log('🔄 Cache Miss - Fetching from DB');
        const { data, error } = await supabase
            .from('projects')
            .select('*, project_assessments(*)')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // 3. 存入快取 (TTL: 5 分鐘 + 隨機 0-60 秒抖動)
        const jitterTTL = 300 + Math.floor(Math.random() * 60);
        await redisSet(cacheKey, data, jitterTTL);

        return NextResponse.json({ data, source: 'supabase' });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

---

## 階段 3: 防穿透 & 防雪崩 (30 分鐘)

### 完整優化實現

使用提供的 `redis-optimized.ts` 文件:

```bash
# 1. 複製到項目
cp redis-optimized.ts frontend/src/lib/

# 2. 更新 package.json
cd frontend
npm install --save-dev @types/node
```

### 在 API 中使用

編輯 `/frontend/src/app/api/projects/accelerated/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { RedisManager } from '@/lib/redis-optimized';
import { NextResponse, NextRequest } from 'next/server';

// 全局初始化
const redisManager = new RedisManager();
const cache = redisManager.getCache();

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

        // 使用 getWithLock 自動防穿透
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
                enableJitter: true, // 隨機抖動防雪崩
            }
        );

        return NextResponse.json({
            data: projects || [],
            source: projects ? 'cache' : 'supabase',
        });
    } catch (error: any) {
        console.error('Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

---

## 監控設置 (10 分鐘)

### 啟動 Redis 監控

編輯 `/frontend/src/lib/init-redis-monitoring.ts`:

```typescript
import { RedisManager } from './redis-optimized';

export function initRedisMonitoring() {
    if (process.env.NODE_ENV !== 'production') {
        const redisManager = new RedisManager();
        const monitor = redisManager.getMonitor();

        // 每 60 秒檢查一次健康狀態
        monitor.startMonitoring(60000);

        console.log('[Redis] Monitoring started');
    }
}
```

### 在 Next.js 中初始化

編輯 `/frontend/next.config.ts` 或 `src/app/layout.tsx`:

```typescript
// 在應用啟動時初始化
import { initRedisMonitoring } from '@/lib/init-redis-monitoring';

if (typeof window === 'undefined') {
    initRedisMonitoring();
}
```

### 查看監控輸出

```bash
# 查看日誌
docker-compose logs frontend | grep "Redis"

# 預期輸出:
# [Redis] Monitoring started
# [Monitor] Redis Health OK - Hit rate: 82.5%
```

---

## 性能驗證

### 負載測試

```bash
# 使用 redis-benchmark 測試連接性能
docker-compose exec redis redis-benchmark -h redis -p 6379 -c 50 -n 10000

# 預期看到:
# - throughput 提升 40-50%
# - latency 降低 30-40%
```

### 性能指標檢查

```bash
# 1. 命中率檢查 (應該 > 80%)
docker-compose exec redis redis-cli info stats | grep keyspace_hits

# 2. 內存使用 (應該 < 70% 限制)
docker-compose exec redis redis-cli info memory | grep used_memory_human

# 3. 連接數 (應該穩定 < 50)
docker-compose exec redis redis-cli client list | wc -l

# 4. 慢查詢 (應該很少)
docker-compose exec redis redis-cli slowlog len
```

---

## 故障排除

### 問題 1: 連接超時

```bash
# 症狀: connect ECONNREFUSED

# 解決方案
docker-compose ps redis
docker-compose logs redis
docker-compose exec redis redis-cli ping
```

### 問題 2: 內存溢出

```bash
# 症狀: OOM command not allowed when used memory > 'maxmemory'

# 檢查
docker-compose exec redis redis-cli info memory

# 解決
# 1. 增加 maxmemory 配置
# 2. 降低 TTL 值加快過期
# 3. 檢查是否有內存洩漏
```

### 問題 3: 命中率低

```bash
# 症狀: hit rate < 60%

# 檢查
docker-compose exec redis redis-cli info stats | grep keyspace

# 可能原因
# 1. TTL 過短，鑰匙快速過期
# 2. 緩存鑰匙設計不當
# 3. 熱數據沒有被緩存

# 解決
# 1. 增加 TTL
# 2. 分析哪些查詢應該被緩存
# 3. 實施緩存預熱
```

### 問題 4: 高延遲

```bash
# 症狀: 查詢平均 > 50ms

# 檢查慢查詢
docker-compose exec redis redis-cli slowlog get 10

# 檢查連接數
docker-compose exec redis redis-cli client list

# 可能原因
# 1. 序列化開銷大 -> 使用 MessagePack
# 2. 連接數過多 -> 增加連接池
# 3. 网絡延迟 -> 檢查網絡配置
```

---

## 效果驗收清單

- [ ] Docker Compose 配置已更新 ✅ Verify: `docker-compose exec redis redis-cli info`
- [ ] Node.js Redis 客戶端已優化 ✅ Verify: 連接時看到 log
- [ ] 容器已重啟 ✅ Verify: `docker-compose ps`
- [ ] MessagePack 序列化已集成 ✅ Verify: `npm list msgpackr`
- [ ] 防穿透機制已實施 ✅ Verify: 快速刷新 5 次同一查詢
- [ ] 監控已啟動 ✅ Verify: 日誌中看到 "Redis Health OK"
- [ ] 命中率 > 80% ✅ Verify: `docker-compose exec redis redis-cli info stats`
- [ ] 延遲 < 20ms ✅ Verify: 性能測試結果

---

## 下一步

1. **監控儀表板** - 部署 Prometheus + Grafana
2. **分佈式快取** - 考慮 Redis Cluster 高可用
3. **快取預熱** - 應用啟動時預加載熱數據
4. **性能調優** - 根據實際工作負載微調參數

---

## 參考資源

- Redis 官方文檔: https://redis.io/documentation
- ioredis 文檔: https://github.com/luin/ioredis
- Redis 最佳實踐: https://redis.io/docs/management/optimization/

---

**完成時間: ~2 小時**
**預期收益: 45-80% 性能提升**

有任何疑問，請參考詳細分析文檔: `REDIS_PERFORMANCE_ANALYSIS.md`

