# PDF Page Navigation Feature

## 概述

為 SOURCE DETAILS 側邊欄添加了 PDF 頁面導航功能，類似 PDF 閱讀器的頁面跳轉體驗。

## 功能特性

### 1. 頁面導航控件
- 顯示當前頁碼和總頁數（例如："PAGE 1 OF 10"）
- 上一頁/下一頁按鈕
- 直接輸入頁碼快速跳轉
- 下拉選擇器選擇特定頁面

### 2. 智能回退機制
- **PDF 文件**：如果有 `pages` 數據，啟用頁面導航
- **DOCX/其他文件**：顯示完整內容，不啟用頁面導航
- **無 pages 數據**：回退到顯示 `content` 欄位

### 3. 設計風格
- Swiss/Brutalist 設計語言
- 黑白配色
- 直角無圓角設計
- Monospace 字體
- 大寫字母

## 技術實現

### 資料結構

#### 數據庫 Schema
```sql
-- sources table
ALTER TABLE public.sources
ADD COLUMN IF NOT EXISTS pages JSONB DEFAULT '[]'::JSONB;

-- 格式：[{page: 1, content: "..."}, {page: 2, content: "..."}]
```

#### TypeScript Types
```typescript
// PageContent interface
interface PageContent {
  page: number;
  content: string;
  tokens?: number;
  tables?: TableData[];
  images?: ImageData[];
  metadata?: PageMetadata;
}

// Source interface
interface Source {
  id: string;
  title?: string;
  content?: string;
  pages?: PageContent[];
  type?: string;
  // ... other fields
}
```

### 組件層次

```
SourceDetailPanel
├── PageNavigation (new)
│   ├── Previous/Next buttons
│   ├── Page input field
│   └── Page dropdown selector
└── Content display area
    └── Current page content or full content
```

### 核心邏輯

#### 1. 判斷是否顯示頁面導航
```typescript
const hasPages = source?.pages && Array.isArray(source.pages) && source.pages.length > 0;
const isPDF = source?.type?.toLowerCase() === 'pdf';
const shouldShowPageNavigation = hasPages && isPDF;
```

#### 2. 內容選擇邏輯
```typescript
const content = evidence
    ? evidence.quote  // Citation 模式
    : shouldShowPageNavigation
        ? source?.pages?.[currentPage - 1]?.content  // PDF 頁面導航模式
        : source?.content;  // 完整內容模式
```

#### 3. 頁面切換處理
```typescript
// Reset to page 1 when source changes
useEffect(() => {
    setCurrentPage(1);
    if (contentContainerRef.current) {
        contentContainerRef.current.scrollTop = 0;
    }
}, [source?.id]);
```

## 使用說明

### 前端使用
1. 用戶點擊 source 項目
2. SourceDetailPanel 自動檢測是否有 pages 數據
3. 如果是 PDF 且有 pages，顯示頁面導航控件
4. 用戶可以：
   - 點擊上一頁/下一頁按鈕
   - 直接輸入頁碼並按 Enter
   - 使用下拉選擇器跳轉
   - 所有操作即時更新內容顯示

### 數據準備
後端 parsing-service 需要確保：
1. PDF 文件解析後返回 `pages` 數據
2. 格式為 `[{page: 1, content: "..."}, ...]`
3. 寫入數據庫 `sources.pages` JSONB 欄位

## 測試指南

### 單元測試
```bash
cd frontend
npm test -- PageNavigation.test.tsx
```

### 手動測試清單
- [ ] PDF 文件顯示頁面導航控件
- [ ] DOCX 文件顯示完整內容（無頁面導航）
- [ ] 上一頁/下一頁按鈕正常工作
- [ ] 第一頁時上一頁按鈕被禁用
- [ ] 最後一頁時下一頁按鈕被禁用
- [ ] 輸入框可以輸入頁碼並跳轉
- [ ] 輸入無效頁碼（<1 或 >總頁數）時恢復為當前頁
- [ ] 下拉選擇器可以跳轉到任意頁面
- [ ] 切換不同 source 時頁碼重置為 1
- [ ] 頁面內容正確顯示當前頁的文字
- [ ] 字符數統計顯示當前頁的字符數

### 邊界情況測試
- [ ] 只有 1 頁的 PDF
- [ ] 空 pages 數組的 PDF（回退到 content）
- [ ] pages 為 null/undefined 的 source（回退到 content）
- [ ] 超過 100 頁的大型 PDF（下拉選擇器性能）

## 文件清單

### 新增文件
```
frontend/src/components/workspace/
├── PageNavigation.tsx                    # 頁面導航組件
└── __tests__/
    └── PageNavigation.test.tsx           # 單元測試

docs/features/
└── pdf-page-navigation.md                # 本文檔
```

### 修改文件
```
frontend/src/components/workspace/
├── SourceDetailPanel.tsx                 # 添加頁面導航整合
└── SourceManager.tsx                     # 更新 Source 接口和 fetchSources

backend/supabase/migrations/
└── 20251222_add_pages_column.sql         # 已存在的 migration
```

## 設計決策

### 1. 為什麼只對 PDF 啟用頁面導航？
- DOCX 通常沒有固定的頁面概念（流式文檔）
- Web 頁面和 Markdown 沒有頁面劃分
- PDF 是唯一有清晰頁面邊界的格式

### 2. 為什麼用 JSONB 而不是關聯表？
- 頁面內容與 source 強綁定，不需要獨立查詢
- JSONB 查詢性能足夠好（PostgreSQL 優化）
- 簡化數據模型，減少 JOIN 操作

### 3. 為什麼保留 content 欄位？
- 回退機制：當 pages 不可用時仍能顯示內容
- 全文搜索：某些搜索場景需要完整文本
- 兼容性：舊數據和非 PDF 文件仍能正常工作

## 未來增強

### 可能的改進方向
1. **縮略圖預覽**：顯示每頁的小縮圖
2. **搜索高亮**：在特定頁面高亮搜索結果
3. **書籤功能**：用戶可以標記重要頁面
4. **頁面範圍選擇**：選擇多個連續頁面查看
5. **快速跳轉**：跳轉到有關鍵字的頁面
6. **頁面元數據**：顯示頁面的表格/圖片數量

### 性能優化
1. **虛擬化**：超大 PDF（>1000 頁）使用虛擬滾動
2. **懶加載**：只加載當前頁和相鄰幾頁的內容
3. **內容緩存**：緩存最近訪問的頁面

## 相關資源

- [Supabase JSONB 文檔](https://supabase.com/docs/guides/database/postgres/json)
- [PageContent TypeScript 接口](/frontend/src/types/content.ts)
- [parsing-service API](/template-parsing-service/service.py)
