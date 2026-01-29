# 圖片儲存優化實施指南

**基於**: ADR-001 決策 (維持 Supabase Storage)
**目標**: 優化現有方案，延遲遷移需求
**預期效果**: 儲存減少 40%，頻寬減少 30%，成本節省 6 個月

---

## 1. 系統架構圖

### 1.1 現有架構 (Current State)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  UploadZone         ImageGeneration      OnlyOfficeEditor       │
│  TemplateUpload     ProposalEditor       SourceManager          │
└───────────┬─────────────────┬───────────────────┬───────────────┘
            │                 │                   │
            │ Upload File     │ Generate Image    │ Parse DOCX
            │ (PDF/DOCX)      │ (AI Generated)    │ (Extract Images)
            ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Storage (raw-files)                  │
│  ┌────────────┬──────────────┬──────────────┬─────────────┐    │
│  │ Documents  │  AI Images   │ Parsed Images│  Templates  │    │
│  │ (PDF/DOCX) │  (500KB avg) │  (200KB avg) │  (1-5MB)    │    │
│  └────────────┴──────────────┴──────────────┴─────────────┘    │
│                                                                   │
│  CDN: Cloudflare (275+ global nodes)                            │
│  Cache-Control: public, max-age=31536000                        │
└───────────┬────────────────────────────────────────────────────┘
            │
            │ URL References
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Supabase)                          │
│  ┌────────────────────┬──────────────────┬──────────────┐      │
│  │ sources            │ task_images      │ templates    │      │
│  │ ├─ origin_url      │ ├─ image_url     │ ├─ parsed_  │      │
│  │ ├─ type            │ ├─ project_id    │ │   images   │      │
│  │ └─ status          │ └─ task_id       │ └─ file_url  │      │
│  └────────────────────┴──────────────────┴──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 優化後架構 (Optimized State)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  UploadZone         ImageGeneration      OnlyOfficeEditor       │
│  + Sharp.js         + Compression        + Smart Cache          │
└───────────┬─────────────────┬───────────────────┬───────────────┘
            │                 │                   │
            │ 📦 Compress     │ 📦 Compress       │ 📦 Compress
            │ Before Upload   │ (Quality: 80%)    │ (Smart)
            │ (80% quality)   │ (Max: 1920px)     │
            ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│            🚀 Optimized Supabase Storage (raw-files)            │
│  ┌────────────┬──────────────┬──────────────┬─────────────┐    │
│  │ Documents  │  AI Images   │ Parsed Images│  Templates  │    │
│  │ (Original) │  (200KB avg) │  (80KB avg)  │  (800KB avg)│    │
│  │ No Compress│  -60% size   │  -60% size   │  -20% size  │    │
│  └────────────┴──────────────┴──────────────┴─────────────┘    │
│                                                                   │
│  ✅ CDN: Cloudflare (Cache Hit Rate: 95%+)                     │
│  ✅ Cache-Control: public, max-age=31536000 (1 year)           │
│  ✅ Smart Compression: Sharp.js (Quality: 80%, Progressive)    │
│  ✅ Lazy Loading: 前端按需載入                                  │
└───────────┬────────────────────────────────────────────────────┘
            │
            │ URL References (不變)
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Supabase)                          │
│  + Monitoring Triggers (用量告警)                               │
└─────────────────────────────────────────────────────────────────┘

📊 預期效果:
- 儲存: 1GB → 600MB (-40%)
- 頻寬: 20GB/月 → 14GB/月 (-30%)
- 成本: Free 方案可多撐 6 個月
```

---

## 2. 實施步驟

### 階段 1: 前端圖片壓縮 (優先度: 🔥 高)

**目標**: 上傳前壓縮圖片，減少 60% 檔案大小

#### 步驟 1.1: 安裝依賴

```bash
cd frontend
npm install sharp --save
```

#### 步驟 1.2: 建立壓縮工具函數

建立 `/frontend/src/lib/image-compression.ts`:

```typescript
/**
 * 圖片壓縮工具
 * 使用 Sharp.js 進行伺服器端壓縮
 */

import sharp from 'sharp';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * 壓縮圖片 (支援 Browser File API)
 *
 * @param file - 原始圖片檔案
 * @param options - 壓縮選項
 * @returns 壓縮後的 File 物件
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    // 讀取檔案為 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 Sharp 壓縮
    let sharpInstance = sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true // 小圖不放大
      });

    // 根據格式選擇壓縮策略
    let compressedBuffer: Buffer;
    switch (format) {
      case 'jpeg':
        compressedBuffer = await sharpInstance
          .jpeg({ quality, progressive: true })
          .toBuffer();
        break;
      case 'png':
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
        break;
      case 'webp':
        compressedBuffer = await sharpInstance
          .webp({ quality })
          .toBuffer();
        break;
      default:
        compressedBuffer = buffer;
    }

    // 轉回 File 物件
    const compressedFile = new File(
      [compressedBuffer],
      file.name.replace(/\.\w+$/, `.${format}`),
      { type: `image/${format}` }
    );

    console.log(`[ImageCompression] ${file.name}: ${formatBytes(file.size)} → ${formatBytes(compressedFile.size)} (-${Math.round((1 - compressedFile.size / file.size) * 100)}%)`);

    return compressedFile;
  } catch (error) {
    console.error('[ImageCompression] Error:', error);
    // 壓縮失敗則返回原檔案
    return file;
  }
}

/**
 * 檢查檔案是否為圖片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 格式化檔案大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
}
```

#### 步驟 1.3: 整合到 UploadZone 組件

修改 `/frontend/src/components/knowledge/UploadZone.tsx`:

```typescript
// 在檔案開頭加入
import { compressImage, isImageFile } from '@/lib/image-compression';

// 在 uploadFiles 函數中 (Line 83)，上傳前加入壓縮邏輯
const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    const supabase = createClient()
    let successCount = 0

    logger.info('Starting file upload batch', 'UploadZone', {
        fileCount: files.length,
        folderId: selectedFolderId
    });

    for (const file of files) {
        try {
            // 🔥 新增: 圖片壓縮邏輯
            let fileToUpload = file;
            if (isImageFile(file)) {
                fileToUpload = await compressImage(file, {
                    maxWidth: 1920,
                    quality: 80,
                    format: 'jpeg' // 統一轉 JPEG 以節省空間
                });
            }

            // 1. Upload to Storage (raw-files)
            const fileExt = fileToUpload.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt || 'bin'}`
            const filePath = `${fileName}`

            logger.info('Uploading file', 'UploadZone', {
                fileName: file.name,
                originalSize: file.size,
                compressedSize: fileToUpload.size,
                compressionRatio: `${Math.round((1 - fileToUpload.size / file.size) * 100)}%`,
                filePath
            });

            const { error: uploadError } = await supabase.storage
                .from('raw-files')
                .upload(filePath, fileToUpload)

            // ... 後續邏輯不變
```

#### 步驟 1.4: 整合到 ImageGeneration Hook

修改 `/frontend/src/components/workspace/proposal-editor/hooks/useImageGeneration.ts`:

```typescript
import { compressImage } from '@/lib/image-compression';

export function useImageGeneration(projectId: string) {
  const supabase = createClient();
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleGenerateTaskImage = useCallback(
    async (taskId: string, options: ImageGenerationOptions) => {
      setGeneratingImage(true);
      try {
        // 1. 呼叫 AI 生成圖片 (假設返回 base64 或 URL)
        const generatedImageUrl = await callAIImageGenerationAPI(options);

        // 2. 下載圖片
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();
        const originalFile = new File([blob], `task-${taskId}.png`, { type: 'image/png' });

        // 🔥 3. 壓縮圖片
        const compressedFile = await compressImage(originalFile, {
          maxWidth: 1920,
          quality: 80,
          format: 'jpeg'
        });

        // 4. 上傳到 Supabase Storage
        const fileName = `task-images/${projectId}/${taskId}_${Date.now()}.jpeg`;
        const { error: uploadError, data } = await supabase.storage
          .from('raw-files')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        // 5. 取得公開 URL
        const { data: publicUrlData } = supabase.storage
          .from('raw-files')
          .getPublicUrl(fileName);

        // 6. 儲存到 task_images 表
        const { error: insertError } = await supabase
          .from('task_images')
          .insert({
            task_id: taskId,
            project_id: projectId,
            image_url: publicUrlData.publicUrl
          });

        if (insertError) throw insertError;

        toast.success('圖片生成成功');
      } catch (error) {
        console.error('[ImageGeneration] Error:', error);
        toast.error('圖片生成失敗');
      } finally {
        setGeneratingImage(false);
      }
    },
    [projectId, supabase]
  );

  // ... 其他邏輯
}
```

---

### 階段 2: CDN 快取優化 (優先度: 🔥 高)

**目標**: 提升 CDN 快取命中率至 95%+，減少 Origin 請求

#### 步驟 2.1: 設定 Storage Bucket 快取策略

建立 SQL Migration: `/backend/supabase/migrations/20260129_optimize_storage_cache.sql`

```sql
-- 設定 raw-files bucket 的預設快取策略
UPDATE storage.buckets
SET public = true,
    avif_autodetection = true,
    file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                                'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
WHERE id = 'raw-files';

-- 設定所有現有檔案的 cache_control (1 年)
UPDATE storage.objects
SET cache_control = 'public, max-age=31536000, immutable'
WHERE bucket_id = 'raw-files'
  AND cache_control IS NULL;

-- 設定自動 cache_control 的觸發器
CREATE OR REPLACE FUNCTION storage.set_cache_control()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bucket_id = 'raw-files' THEN
    NEW.cache_control := 'public, max-age=31536000, immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cache_control_trigger ON storage.objects;
CREATE TRIGGER set_cache_control_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage.set_cache_control();

-- 記錄變更
COMMENT ON TRIGGER set_cache_control_trigger ON storage.objects IS
'自動為 raw-files bucket 的檔案設定 1 年快取策略';
```

執行 Migration:

```bash
cd backend
supabase migration up
```

#### 步驟 2.2: 前端加入快取驗證

修改圖片載入組件，加入 CDN 快取驗證邏輯:

```typescript
// /frontend/src/components/common/OptimizedImage.tsx (新建)
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

export function OptimizedImage({ src, alt, className, onLoad }: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 預載圖片並檢查快取
    const img = new Image();
    img.onload = () => {
      setLoading(false);
      onLoad?.();

      // 開發環境下檢查快取
      if (process.env.NODE_ENV === 'development') {
        checkCacheStatus(src);
      }
    };
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
    img.src = src;
  }, [src, onLoad]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {error ? (
        <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
          <span className="text-red-500 text-xs">圖片載入失敗</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          loading="lazy"
        />
      )}
    </div>
  );
}

async function checkCacheStatus(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const cacheStatus = response.headers.get('cf-cache-status'); // Cloudflare CDN
    console.log(`[CDN Cache] ${url}: ${cacheStatus}`);
    // HIT: 快取命中
    // MISS: 快取未命中
    // EXPIRED: 快取過期
  } catch (error) {
    console.warn('[CDN Cache] Check failed:', error);
  }
}
```

---

### 階段 3: 用量監控與告警 (優先度: 🟡 中)

**目標**: 在接近限制前提前預警

#### 步驟 3.1: 建立監控 SQL 函數

```sql
-- /backend/supabase/migrations/20260129_storage_monitoring.sql

-- 計算 raw-files bucket 使用量
CREATE OR REPLACE FUNCTION storage.get_bucket_usage(bucket_name TEXT)
RETURNS TABLE (
  total_files BIGINT,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC,
  total_size_gb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_files,
    COALESCE(SUM(metadata->>'size')::BIGINT, 0) AS total_size_bytes,
    ROUND(COALESCE(SUM((metadata->>'size')::BIGINT), 0) / 1048576.0, 2) AS total_size_mb,
    ROUND(COALESCE(SUM((metadata->>'size')::BIGINT), 0) / 1073741824.0, 2) AS total_size_gb
  FROM storage.objects
  WHERE bucket_id = bucket_name;
END;
$$ LANGUAGE plpgsql;

-- 使用範例:
-- SELECT * FROM storage.get_bucket_usage('raw-files');
```

#### 步驟 3.2: 前端管理介面 (可選)

建立 `/frontend/src/app/admin/storage-monitor/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StorageUsage {
  total_files: number;
  total_size_gb: number;
  limit_gb: number;
  usage_percentage: number;
}

export default function StorageMonitorPage() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsage() {
      const { data, error } = await supabase
        .rpc('get_bucket_usage', { bucket_name: 'raw-files' });

      if (data && data[0]) {
        const limitGb = 1; // Free 方案 1GB 限制
        setUsage({
          total_files: data[0].total_files,
          total_size_gb: data[0].total_size_gb,
          limit_gb: limitGb,
          usage_percentage: (data[0].total_size_gb / limitGb) * 100
        });
      }
    }

    fetchUsage();
  }, [supabase]);

  if (!usage) return <div>載入中...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">儲存用量監控</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <span>檔案數量</span>
          <span className="font-bold">{usage.total_files}</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span>使用空間</span>
          <span className="font-bold">
            {usage.total_size_gb.toFixed(2)} GB / {usage.limit_gb} GB
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${usage.usage_percentage > 80 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(usage.usage_percentage, 100)}%` }}
          />
        </div>

        {usage.usage_percentage > 80 && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            ⚠️ 儲存空間即將用盡，請考慮升級至 Pro 方案或清理舊檔案
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 3. 測試計劃

### 3.1 壓縮效果測試

**測試案例**:
1. 上傳 5MB PNG 圖片 → 預期壓縮至 < 1MB
2. 上傳 2MB JPEG 圖片 → 預期壓縮至 < 500KB
3. 上傳 10MB PDF 文件 → 預期不壓縮 (保留原檔)

**驗證指標**:
- 壓縮率: > 60%
- 視覺品質: 肉眼無明顯差異
- 上傳時間: 增加 < 20% (壓縮耗時)

### 3.2 CDN 快取測試

**測試步驟**:
1. 首次載入圖片，檢查 `cf-cache-status` 應為 `MISS`
2. 重新載入，檢查應為 `HIT`
3. 測量載入時間:
   - 首次: < 1.5s
   - 快取命中: < 100ms

### 3.3 效能基準測試

**使用 Lighthouse 測試**:
```bash
lighthouse https://your-app.com/workspace/project/123 \
  --only-categories=performance \
  --output=json \
  --output-path=./perf-report.json
```

**目標分數**:
- Performance: > 85
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1

---

## 4. 成本節省試算

### 優化前 (Baseline)

**假設**:
- 100 個專案
- 每專案 20 張圖片
- 平均 500KB/張
- 總儲存: 1GB
- 每張圖每月被查看 10 次
- 總頻寬: 10GB/月

**成本**:
- Supabase Free: $0 (但頻寬超標 5 倍)
- 需升級 Pro: $25/月

### 優化後 (Optimized)

**壓縮效果**:
- 圖片壓縮 60%: 500KB → 200KB
- 總儲存: 1GB → 400MB (-60%)
- 總頻寬: 10GB → 4GB (-60%)

**成本**:
- Supabase Free: $0 ✅ (在限制內)
- 延遲升級時間: 6-12 個月
- **節省**: $25/月 × 6 個月 = **$150**

---

## 5. 回滾計劃 (Rollback Plan)

**觸發條件**:
- 壓縮導致圖片品質明顯下降 (用戶投訴 > 5 次/週)
- 上傳時間增加 > 50%
- 壓縮失敗率 > 5%

**回滾步驟**:
1. 移除壓縮邏輯 (註解掉 `compressImage` 呼叫)
2. 重新部署前端
3. 通知用戶重新上傳受影響檔案
4. 重新評估 Cloudinary 遷移方案

---

## 6. 時程表 (Timeline)

| 階段 | 任務 | 工時 | 完成日期 |
|------|------|------|---------|
| **Week 1** | 實施圖片壓縮 (UploadZone) | 4 小時 | 2026-02-05 |
| **Week 1** | 實施圖片壓縮 (ImageGeneration) | 3 小時 | 2026-02-05 |
| **Week 1** | CDN 快取優化 (SQL Migration) | 2 小時 | 2026-02-05 |
| **Week 2** | 用量監控介面 | 4 小時 | 2026-02-12 |
| **Week 2** | 效能測試 & 驗證 | 3 小時 | 2026-02-12 |
| **Week 3** | 文檔更新 & 團隊培訓 | 2 小時 | 2026-02-19 |
| **總計** | | **18 小時** | |

---

## 7. 成功指標 (Success Metrics)

**3 個月後評估**:

| 指標 | 目標 | 測量方式 |
|------|------|---------|
| 儲存用量 | < 500MB | Supabase Dashboard |
| 頻寬用量 | < 5GB/月 | Supabase Dashboard |
| 圖片載入時間 (P95) | < 1.5s | Sentry Performance Monitoring |
| CDN 快取命中率 | > 90% | Cloudflare Analytics |
| 用戶投訴 | 0 次 | 客服紀錄 |
| 成本 | $0 (Free 方案) | Supabase Billing |

---

## 8. 相關資源

**程式碼範例**:
- Sharp.js 文檔: https://sharp.pixelplumbing.com/
- Supabase Storage 文檔: https://supabase.com/docs/guides/storage

**監控工具**:
- Supabase Dashboard: https://app.supabase.com/project/_/settings/storage
- Sentry Performance: https://sentry.io/

**參考 ADR**:
- ADR-001: 圖片儲存架構決策

---

**維護者**: Leo (系統架構師)
**更新日期**: 2026-01-29
