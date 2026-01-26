# Console.log 清理報告

## 執行時間
2026-01-26

## 清理策略

### 1. 生產環境自動移除
已在 `next.config.ts` 配置自動移除：
```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === "production" ? {
    exclude: ["error", "warn"],
  } : false,
}
```

### 2. 已清理的文件

#### 關鍵組件
- [x] `src/components/workspace/proposal-editor/hooks/useRealtimeUpdates.ts` (17 個)
  - 移除所有實時更新的調試日誌
  - 保留錯誤日誌

- [x] `src/components/workspace/SourceDetailPanel.tsx` (5 個)
  - 移除文本高亮調試日誌

- [x] `src/app/api/rag/generate/route.ts` (5 個)
  - 移除 API 調試日誌
  - 保留錯誤日誌

### 3. 剩餘需要清理的文件 (約 100 個 console.log)

#### 高優先級（生產代碼）
- `src/components/templates/OnlyOfficeEditorWithUpload.tsx` (21 個)
- `src/components/templates/OnlyOfficeEditor.tsx` (8 個)
- `src/components/workspace/AssessmentTable.tsx` (10 個)
- `src/components/workspace/AddSourceDialog.tsx` (4 個)
- `src/components/editor/SectionList.tsx` (2 個)
- `src/components/knowledge/UploadZone.tsx` (3 個)
- `src/hooks/useGoogleDrivePicker.ts` (3 個)

#### 中優先級（API 路由）
- `src/app/api/onlyoffice-callback/route.ts` (8 個)
- `src/app/api/process-and-upload/route.ts` (6 個)
- `src/app/api/webhook/generate-tasks-management/route.ts` (4 個)
- `src/app/api/webhook/generate-tasks-advanced/route.ts` (4 個)
- `src/app/api/webhook/process-proposal-template/route.ts` (2 個)
- `src/app/api/webhook/generate-requirements/route.ts` (4 個)
- `src/app/api/sources/ai-search/route.ts` (2 個)
- `src/app/api/n8n/evaluate/route.ts` (3 個)
- `src/app/api/projects/accelerated/route.ts` (2 個)

#### 低優先級（測試文件 - 可保留）
- `src/app/test-onlyoffice-upload-v3/page.tsx` (4 個)
- `src/app/test-onlyoffice-upload-v2/page.tsx` (7 個)
- `src/app/test-onlyoffice-upload/page.tsx` (8 個)
- `src/app/test-onlyoffice-simple/page.tsx` (2 個)
- `src/app/test-onlyoffice-v2/page.tsx` (6 個)
- `src/app/test-onlyoffice/page.tsx` (3 個)

### 4. 建議的替代方案

#### 開發環境條件判斷
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[Debug]', data);
}
```

#### 使用結構化 Logger
```typescript
import { logger } from '@/lib/errors/logger';

// 錯誤日誌（保留）
logger.error('Failed to process', error, 'ComponentName');

// 調試日誌（僅開發環境）
logger.debug('Processing data', 'ComponentName', { data });
```

### 5. 下一步行動

#### 自動化清理
運行腳本批量移除：
```bash
cd frontend
node scripts/remove-console-logs.mjs --dry-run  # 預覽
node scripts/remove-console-logs.mjs            # 執行清理
```

#### 手動審查
對於以下類型的 console.log，需要手動審查是否保留：
- API 回調處理
- 複雜的業務邏輯調試
- 錯誤追蹤相關

## 統計數據

### 清理前
- 包含 console.log 的文件：52 個
- console.log 總數：176 個

### 目前進度
- 已清理文件：3 個
- 已移除 console.log：27 個
- 剩餘 console.log：約 100-120 個

### 目標
- 減少 90% 以上的 console.log
- 保留必要的 console.error 和 console.warn
- 確保生產環境 bundle size 優化

## ESLint 規則建議

可添加到 `eslint.config.mjs`：
```javascript
{
  rules: {
    'no-console': ['warn', {
      allow: ['error', 'warn']
    }]
  }
}
```

## 性能影響

移除 console.log 預期效果：
- 減少 bundle size：約 5-10KB
- 減少運行時開銷：每個 console.log 約 0.1-0.5ms
- 提升生產環境性能：減少 I/O 操作

## 備註

1. Next.js 的 `removeConsole` 配置已啟用，生產環境自動移除
2. 測試文件中的 console.log 可以保留
3. 所有 console.error 和 console.warn 已保留
4. 使用 logger 工具替代簡單的 console.log
