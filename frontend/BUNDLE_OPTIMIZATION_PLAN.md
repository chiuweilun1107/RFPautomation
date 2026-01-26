# 前端 Bundle Size 優化計劃

**日期**: 2026-01-26
**目標**: 減少初始 bundle size 20-30%，提升首次加載速度 15-20%

## 當前狀況分析

### 已實施的優化
- ✅ Next.js 16 + Turbopack 啟用
- ✅ 部分頁面使用 dynamic import（planning, writing, assessment）
- ✅ `optimizePackageImports` 配置（lucide-react, @radix-ui, react-markdown, @tiptap）
- ✅ 生產環境移除 console.log
- ✅ 禁用生產環境 source maps

### 大型組件識別（需要優化）
根據代碼行數分析，以下組件是優化重點：

1. **ProposalStructureEditor.tsx** (2206行) - 最大組件
2. **proposal-editor/index.tsx** (855行)
3. **SourceManager.tsx** (829行)
4. **SectionList.tsx** (672行)
5. **TableOfContentsGenerator.tsx** (670行)
6. **OnlyOfficeEditorWithUpload.tsx** (461行)
7. **AssessmentTable.tsx** (447行)
8. **TenderList.tsx** (377行)

## 優化策略

### 1. 路由級別代碼分割（最高優先級）✅

**已實施:**
- ✅ `/dashboard/[id]/planning` - TenderPlanning 懶加載
- ✅ `/dashboard/[id]/writing` - WritingTable 懶加載
- ✅ `/dashboard/[id]/assessment` - AssessmentTable 懶加載

**待實施:**
```typescript
// ❌ 未實施懶加載的路由
- /dashboard/[id]/presentation
- /dashboard/[id]/handover
- /dashboard/[id]/launch
- /dashboard/templates/[id]/design
- /dashboard/knowledge
```

### 2. 組件級別懶加載（高優先級）

#### Dialog 組件懶加載
大型 Dialog 組件應該在打開時才加載：

```typescript
// 待優化組件
const AddSourceDialog = dynamic(() => import('@/components/workspace/AddSourceDialog'))
const CreateProjectDialog = dynamic(() => import('@/components/dashboard/CreateProjectDialogWrapper'))
const UploadResourcesDialog = dynamic(() => import('@/components/knowledge/UploadResourcesDialog'))
const SelectTemplateDialog = dynamic(() => import('@/components/templates/SelectTemplateDialog'))
```

#### 編輯器懶加載
```typescript
// 🔴 高優先級
const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'))
const OnlyOfficeEditor = dynamic(() => import('@/components/templates/OnlyOfficeEditor'))
const ProposalStructureEditor = dynamic(() => import('@/components/workspace/ProposalStructureEditor'))
```

#### PDF/文檔查看器懶加載
```typescript
const DocxPreview = dynamic(() => import('@/components/templates/DocxPreview'))
const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer')) // 如果存在
```

### 3. 第三方庫優化（中優先級）

#### React Markdown 懶加載
```typescript
// 當前: 直接導入
import ReactMarkdown from 'react-markdown'

// 優化: 懶加載
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div>載入中...</div>
})
```

#### Chart 庫懶加載
如果使用圖表庫（recharts, chart.js 等），應該懶加載

#### PDF.js 懶加載
如果使用 PDF.js，應該在需要時才加載

### 4. 圖片優化（中優先級）

```typescript
// 使用 Next.js Image 組件
import Image from 'next/image'

// 懶加載圖片
<Image
  src="/path/to/image.png"
  alt="Description"
  width={500}
  height={300}
  loading="lazy" // 預設值
  placeholder="blur" // 可選
/>
```

### 5. Bundle 分析配置（必須）

已配置 `@next/bundle-analyzer`，運行方式：

```bash
npm run analyze
```

這將生成 bundle 分析報告，可視化展示各個包的大小。

## 實施步驟

### Phase 1: 路由級別分割（Week 1）
1. ✅ 修復 TypeScript 錯誤（進行中）
2. ⏳ 為所有剩餘路由添加 dynamic import
3. ⏳ 添加適當的 loading 組件

### Phase 2: 大型組件懶加載（Week 1-2）
1. ⏳ ProposalStructureEditor 懶加載
2. ⏳ SourceManager 懶加載
3. ⏳ 所有編輯器組件懶加載
4. ⏳ Dialog 組件懶加載

### Phase 3: 第三方庫優化（Week 2）
1. ⏳ React Markdown 條件加載
2. ⏳ Tiptap 延遲初始化
3. ⏳ PDF 相關庫懶加載

### Phase 4: 驗證與測試（Week 2）
1. ⏳ 運行 bundle 分析
2. ⏳ Lighthouse 性能測試
3. ⏳ 記錄優化前後對比

## 性能指標目標

### Before Optimization (估計)
- Initial Bundle Size: ~800KB (gzipped)
- FCP (First Contentful Paint): ~2.5s
- LCP (Largest Contentful Paint): ~3.5s
- TTI (Time to Interactive): ~4.0s

### After Optimization (目標)
- Initial Bundle Size: ~560KB (gzipped) - **減少 30%**
- FCP: ~2.0s - **減少 20%**
- LCP: ~2.8s - **減少 20%**
- TTI: ~3.2s - **減少 20%**

## 驗證方法

### 1. Bundle 分析
```bash
npm run analyze
```
查看並記錄：
- 最大的包
- 可拆分的共享依賴
- 重複依賴

### 2. Lighthouse 測試
```bash
# 在 Chrome DevTools 中運行
1. 打開 DevTools
2. 切換到 Lighthouse 標籤
3. 選擇 "Performance" + "Desktop"
4. 運行分析
```

記錄指標：
- Performance Score
- FCP, LCP, CLS, TTI
- Bundle Size

### 3. Network 分析
在 Chrome DevTools Network 標籤中：
- Disable cache
- 記錄首次加載的資源大小
- 記錄加載時間

## 注意事項

### Loading 組件設計
所有懶加載組件應該有適當的 loading 狀態：

```typescript
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner />
    <span className="ml-2">載入中...</span>
  </div>
)

const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <LoadingFallback /> }
)
```

### 無障礙考慮
- Loading 狀態應該可被螢幕閱讀器識別
- 使用 `aria-live` 或 `aria-busy` 屬性

### SEO 考慮
- 關鍵內容不應該懶加載
- 首屏內容應該 SSR
- 使用 `ssr: false` 選項要謹慎

## 後續維護

### 代碼審查清單
- [ ] 新增大型組件（>200行）是否使用懶加載？
- [ ] 新增第三方庫是否評估 bundle impact？
- [ ] 是否定期運行 bundle 分析？
- [ ] 性能指標是否符合目標？

### 監控
- 設置 Lighthouse CI
- 監控 bundle size 變化
- 設置性能預算（Performance Budget）

## 參考資料

- [Next.js Code Splitting](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React.lazy](https://react.dev/reference/react/lazy)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Web Vitals](https://web.dev/vitals/)
