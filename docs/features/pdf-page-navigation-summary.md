# PDF 頁面導航功能實現總結

## 完成狀態：✅ 已完成

## 實現內容

### 1. 類型定義更新 ✅
- **SourceDetailPanel.tsx**: 添加 `pages?: PageContent[]` 和 `type?: string` 到 Source 接口
- **SourceManager.tsx**: 添加 `pages?: Array<{ page: number; content: string; tokens?: number }>` 到 Source 接口
- 從 `@/types/content` 導入 `PageContent` 類型

### 2. 數據庫查詢更新 ✅
- **SourceManager.tsx**: 更新 `fetchSources()` 以 SELECT `pages` 欄位
- 查詢：`select('*, pages')` 確保從數據庫獲取頁面數據

### 3. 頁面導航組件 ✅
**新文件**: `/frontend/src/components/workspace/PageNavigation.tsx`

特性：
- 上一頁/下一頁按鈕（ChevronLeft/ChevronRight 圖標）
- 頁碼輸入框（支援直接輸入和 Enter 鍵跳轉）
- 頁碼下拉選擇器（Select 組件）
- 顯示當前頁和總頁數："PAGE X OF Y"
- Swiss/Brutalist 設計風格：
  - 黑白配色
  - 直角無圓角（rounded-none）
  - Monospace 字體（font-mono）
  - 大寫文字（uppercase）
  - 邊框：border-black dark:border-white

### 4. SourceDetailPanel 整合 ✅

#### 邏輯更新
```typescript
// 判斷是否顯示頁面導航
const hasPages = source?.pages && Array.isArray(source.pages) && source.pages.length > 0;
const isPDF = source?.type?.toLowerCase() === 'pdf';
const shouldShowPageNavigation = hasPages && isPDF;

// 內容選擇邏輯
const content = evidence
    ? evidence.quote
    : shouldShowPageNavigation
        ? source?.pages?.[currentPage - 1]?.content
        : source?.content;
```

#### UI 更新
- 頁面導航控件位於 SUMMARY 和 CONTENT 之間
- 使用 `key={source.id}` 自動重置頁面狀態（React 推薦模式）
- 標題動態顯示：
  - PDF with pages: "PAGE X CONTENT"
  - Others: "FULL CONTENT"
- TableOfContents 只在非頁面導航模式顯示

### 5. 回退機制 ✅
- **PDF 文件 + 有 pages 數據**：啟用頁面導航
- **PDF 文件 + 無 pages 數據**：回退到顯示 `content`
- **DOCX/其他文件**：始終顯示 `content`（無頁面導航）
- **Evidence (Citation) 模式**：顯示 quote，不受影響

### 6. 測試文件 ✅
**新文件**: `/frontend/src/components/workspace/__tests__/PageNavigation.test.tsx`

測試覆蓋：
- 渲染正確的頁面信息
- 上一頁/下一頁按鈕功能
- 按鈕在邊界狀態的禁用（第一頁/最後一頁）
- 輸入框輸入和驗證
- Enter 鍵提交
- 無效頁碼處理

### 7. 文檔 ✅
**新文件**: `/docs/features/pdf-page-navigation.md`

包含：
- 功能概述和特性
- 技術實現細節
- 使用說明
- 測試指南
- 設計決策
- 未來增強方向

## 代碼質量驗證

### ESLint ✅
```bash
npx eslint src/components/workspace/PageNavigation.tsx src/components/workspace/SourceDetailPanel.tsx --max-warnings 0
```
結果：**通過，無錯誤無警告**

### TypeScript ✅
- 所有類型定義正確
- 無類型錯誤
- 正確使用 PageContent 接口
- 正確處理可選屬性

### React 最佳實踐 ✅
- 使用 `key` prop 重置狀態（避免 useEffect 中的 setState）
- 正確的 TypeScript 類型注解
- 清晰的組件接口
- 適當的狀態管理

## 文件清單

### 新增文件
```
frontend/src/components/workspace/
├── PageNavigation.tsx                    # 頁面導航組件
└── __tests__/
    └── PageNavigation.test.tsx           # 單元測試

docs/features/
├── pdf-page-navigation.md                # 完整功能文檔
└── pdf-page-navigation-summary.md        # 本文檔
```

### 修改文件
```
frontend/src/components/workspace/
├── SourceDetailPanel.tsx                 # 整合頁面導航
│   ├── 添加 pages 欄位到 Source 接口
│   ├── 導入 PageNavigation 組件
│   ├── 添加頁面切換邏輯
│   └── 更新 UI 渲染邏輯
└── SourceManager.tsx                     # 更新數據獲取
    ├── 添加 pages 欄位到 Source 接口
    └── 更新 fetchSources 查詢
```

## 測試指南

### 手動測試清單

#### PDF 文件（有 pages 數據）
- [ ] 顯示頁面導航控件
- [ ] 顯示正確的當前頁和總頁數
- [ ] 上一頁按鈕工作正常
- [ ] 下一頁按鈕工作正常
- [ ] 第一頁時上一頁按鈕禁用
- [ ] 最後一頁時下一頁按鈕禁用
- [ ] 輸入框可以輸入頁碼
- [ ] Enter 鍵提交跳轉
- [ ] 無效頁碼（<1 或 >總頁數）恢復為當前頁
- [ ] 下拉選擇器顯示所有頁面
- [ ] 下拉選擇器跳轉正確
- [ ] 頁面內容正確顯示當前頁
- [ ] 字符數統計正確

#### DOCX/其他文件
- [ ] 不顯示頁面導航控件
- [ ] 顯示完整內容
- [ ] TableOfContents 正常工作

#### 切換文件
- [ ] 切換到不同 PDF 時頁碼重置為 1
- [ ] 切換到 DOCX 時顯示完整內容
- [ ] 切換回 PDF 時重新顯示頁面導航

#### 邊界情況
- [ ] 只有 1 頁的 PDF
- [ ] pages 為空數組的 PDF
- [ ] pages 為 null/undefined 的 source
- [ ] 超過 100 頁的大型 PDF

### 單元測試
```bash
cd frontend
npm test -- PageNavigation.test.tsx
```

## 設計決策理由

### 1. 為什麼使用 `key={source.id}` 重置狀態？
**React 推薦的模式**：當 key 改變時，React 會卸載舊組件並掛載新組件，自動重置所有狀態。這比在 useEffect 中調用 setState 更簡潔、更高效，且避免了潛在的競態條件。

### 2. 為什麼只對 PDF 啟用頁面導航？
- **PDF**：有固定的頁面邊界，頁碼有意義
- **DOCX**：流式文檔，沒有固定頁面概念
- **Web/Markdown**：沒有頁面劃分

### 3. 為什麼保留 content 欄位？
- **回退機制**：當 pages 不可用時仍能顯示內容
- **兼容性**：支援舊數據和非 PDF 文件
- **全文搜索**：某些場景需要完整文本

### 4. 為什麼用 JSONB 而不是關聯表？
- 頁面內容與 source 強綁定
- PostgreSQL JSONB 性能優秀
- 簡化數據模型，減少 JOIN

## 使用示例

### 前端使用
```typescript
// 1. Source 會自動包含 pages 數據（從數據庫獲取）
const source = {
  id: "uuid",
  title: "Document.pdf",
  type: "pdf",
  pages: [
    { page: 1, content: "Page 1 content..." },
    { page: 2, content: "Page 2 content..." }
  ]
};

// 2. SourceDetailPanel 自動檢測並顯示頁面導航
<SourceDetailPanel source={source} onClose={...} />

// 3. 用戶互動
// - 點擊下一頁 → 顯示 page 2
// - 輸入 "5" + Enter → 跳轉到 page 5
// - 下拉選擇 "PAGE 3" → 跳轉到 page 3
```

### 後端準備
確保 parsing-service 返回正確格式：
```python
# ParseResponse
{
    "pages": [
        {"page": 1, "content": "..."},
        {"page": 2, "content": "..."}
    ]
}

# 寫入數據庫
await supabase.table('sources').insert({
    "pages": pages_data  # JSONB 欄位
})
```

## 性能考量

### 當前實現
- 所有頁面數據一次性加載（存在 `source.pages`）
- 適用於中小型 PDF（<100 頁）
- 頁面切換即時（無網路請求）

### 未來優化（如需要）
- **懶加載**：只加載當前頁和相鄰幾頁
- **虛擬化**：超大 PDF（>1000 頁）使用虛擬滾動
- **分頁查詢**：從數據庫按需獲取頁面

## 相關資源

- [PageContent 類型定義](/frontend/src/types/content.ts)
- [Supabase JSONB 欄位](/backend/supabase/migrations/20251222_add_pages_column.sql)
- [parsing-service 文檔](/template-parsing-service/service.py)
- [React Key Prop 文檔](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)

## 下一步

功能已完成並準備好使用。後續可以考慮：

1. **視覺增強**
   - 添加頁面縮略圖預覽
   - 高亮當前頁的重要內容

2. **功能擴展**
   - 書籤功能
   - 頁面註釋
   - 搜索跳轉到特定頁面

3. **性能優化**
   - 懶加載大型 PDF
   - 內容緩存策略

4. **UX 改進**
   - 鍵盤快捷鍵（PageUp/PageDown）
   - 觸控滑動切換頁面
   - 頁面載入動畫
