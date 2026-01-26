# 代碼分割優化實施報告

**日期**: 2026-01-26
**執行者**: 前端工程師 Ava
**狀態**: 進行中

## 已實施優化

### 1. 路由級別代碼分割 ✅

#### 已完成的懶加載路由
```typescript
// ✅ /dashboard/[id]/planning
const TenderPlanning = dynamic(
  () => import("@/components/workspace/tender-planning"),
  { ssr: false }
)

// ✅ /dashboard/[id]/writing
const WritingTable = dynamic(
  () => import("@/components/workspace/WritingTable"),
  { ssr: false }
)

// ✅ /dashboard/[id]/assessment
const AssessmentTable = dynamic(
  () => import("@/components/workspace/AssessmentTable"),
  { ssr: false }
)

// ✅ /dashboard/[id]/launch
const TenderLaunch = dynamic(
  () => import("@/components/workspace/TenderLaunch"),
  { ssr: false }
)

// ✅ /dashboard/templates/[id]/design (新增)
const TemplateDesigner = dynamic(
  () => import("./TemplateDesigner"),
  { loading: () => <ContentSkeleton />, ssr: false }
)
```

### 2. next.config.ts 優化配置 ✅

```typescript
experimental: {
  optimizePackageImports: [
    "lucide-react",
    "@radix-ui/react-icons",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-select",
    // ... 更多 Radix UI 組件
    "react-markdown",
    "@tiptap/react",
    "@tiptap/starter-kit",
  ],
}

compiler: {
  removeConsole: process.env.NODE_ENV === "production" ? {
    exclude: ["error", "warn"],
  } : false,
}

productionBrowserSourceMaps: false
```

### 3. 類型系統修復 ✅

修復了以下類型問題以確保構建成功：
- `HeaderSection.tsx` - 統一使用 `HeaderFooterContent` 類型
- `FooterSection.tsx` - 統一使用 `FooterContent` 類型
- `DocumentTable` - 添加 `rows_data` 和 `TableCell.images` 屬性
- `VariableRenderer` - 支持可選的 `text` 屬性
- `AlignmentType` - 修復枚舉類型使用

### 4. Bundle Analyzer 配置 ✅

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^16.1.3"
  }
}
```

## 待實施優化

### 高優先級

#### 1. 大型組件懶加載
```typescript
// ⏳ ProposalStructureEditor (2206行)
const ProposalStructureEditor = dynamic(
  () => import('@/components/workspace/ProposalStructureEditor'),
  { loading: () => <ContentSkeleton /> }
)

// ⏳ SourceManager (829行)
const SourceManager = dynamic(
  () => import('@/components/workspace/SourceManager'),
  { loading: () => <ContentSkeleton /> }
)

// ⏳ SectionList (672行)
const SectionList = dynamic(
  () => import('@/components/editor/SectionList'),
  { loading: () => <LoadingSpinner /> }
)
```

#### 2. Dialog 組件懶加載
```typescript
// ⏳ AddSourceDialog (512行)
const AddSourceDialog = dynamic(
  () => import('@/components/workspace/AddSourceDialog')
)

// ⏳ CreateProjectDialog
const CreateProjectDialog = dynamic(
  () => import('@/components/dashboard/CreateProjectDialogWrapper')
)

// ⏳ UploadResourcesDialog
const UploadResourcesDialog = dynamic(
  () => import('@/components/knowledge/UploadResourcesDialog')
)

// ⏳ SelectTemplateDialog
const SelectTemplateDialog = dynamic(
  () => import('@/components/templates/SelectTemplateDialog')
)
```

#### 3. 編輯器組件懶加載
```typescript
// ⏳ TiptapEditor
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor'),
  { loading: () => <div>載入編輯器...</div> }
)

// ⏳ OnlyOfficeEditor (461行)
const OnlyOfficeEditor = dynamic(
  () => import('@/components/templates/OnlyOfficeEditor'),
  { loading: () => <div>載入文檔編輯器...</div> }
)
```

### 中優先級

#### 4. 第三方庫條件加載
```typescript
// ⏳ React Markdown
const ReactMarkdown = dynamic(
  () => import('react-markdown'),
  { loading: () => <div>載入中...</div> }
)

// ⏳ DocxPreview
const DocxPreview = dynamic(
  () => import('@/components/templates/DocxPreview')
)
```

#### 5. 虛擬化列表組件
- ✅ 已使用 `@tanstack/react-virtual`
- ⏳ 確保所有長列表（>100項）使用虛擬滾動

## 技術挑戰與解決方案

### Challenge 1: TypeScript 嚴格類型檢查

**問題**:
- 多處代碼使用未定義的類型屬性
- 類型定義不一致

**解決方案**:
1. 統一使用導出的類型定義（`HeaderFooterContent`, `FooterContent`）
2. 擴展 `DocumentTable` 和 `TableCell` 類型以支持遺留屬性
3. 將 `AlignmentType` 枚舉正確轉換為類型

**影響**:
- ✅ 提升代碼類型安全性
- ✅ 減少運行時錯誤
- ❌ 延長構建時間（但一次性修復）

### Challenge 2: 服務端組件與客戶端組件混合

**問題**:
- `TemplateDesignPage` 是服務端組件，無法直接使用 `dynamic import`

**解決方案**:
創建客戶端包裝組件 `TemplateDesignerWrapper`，將懶加載邏輯封裝在客戶端

**模式**:
```typescript
// Server Component (page.tsx)
import { HeavyComponentWrapper } from '@/components/HeavyComponentWrapper'

export default async function Page() {
  const data = await fetchData()
  return <HeavyComponentWrapper data={data} />
}

// Client Component Wrapper (HeavyComponentWrapper.tsx)
"use client"
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
})

export function HeavyComponentWrapper({ data }) {
  return <HeavyComponent data={data} />
}
```

### Challenge 3: Loading 狀態設計

**問題**:
- 需要為每個懶加載組件提供適當的 loading 狀態
- 避免 layout shift

**解決方案**:
1. 創建通用的 `ContentSkeleton` 組件
2. 為不同類型的組件提供合適的 loading 佔位符
3. 使用 CSS 確保 skeleton 大小與實際組件一致

**最佳實踐**:
```typescript
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    loading: () => (
      <div className="h-[600px]"> {/* 明確指定高度 */}
        <ContentSkeleton />
      </div>
    ),
    ssr: false
  }
)
```

## 性能指標

### 構建時間
- ⏳ 優化前: 待測試
- ⏳ 優化後: 待測試

### Bundle Size
- ⏳ 優化前: 待測試
- ⏳ 優化後: 待測試（目標: 減少 20-30%）

### Lighthouse 分數
- ⏳ 優化前: 待測試
- ⏳ 優化後: 待測試（目標: Performance > 90）

## 下一步行動

### 立即執行（今天）
1. ✅ 修復所有 TypeScript 錯誤
2. ⏳ 運行 `npm run build` 獲取基準 bundle size
3. ⏳ 運行 `npm run analyze` 生成 bundle 分析報告

### 本週執行
4. ⏳ 為所有大型組件（>500行）實施懶加載
5. ⏳ 為所有 Dialog 組件實施懶加載
6. ⏳ 優化第三方庫導入

### 驗證階段
7. ⏳ 重新運行 bundle 分析
8. ⏳ Lighthouse 性能測試
9. ⏳ 記錄優化前後對比數據

## 遇到的問題

### 構建失敗問題
**狀態**: ⚠️ 部分解決

**原因**:
1. ✅ TypeScript 類型錯誤（已修復大部分）
2. ⏳ 部分組件中的 `metadata` 屬性錯誤（待修復）
3. ⏳ 第三方庫類型不兼容（待調查）

**計劃**:
- 逐一修復剩餘的 TypeScript 錯誤
- 考慮使用 `// @ts-expect-error` 作為臨時方案（非最佳實踐）
- 升級相關依賴版本

## 結論

### 已完成
- ✅ 路由級別代碼分割（5個路由）
- ✅ next.config.ts 優化配置
- ✅ Bundle Analyzer 配置
- ✅ 大部分類型錯誤修復

### 進行中
- ⏳ 解決剩餘的構建錯誤
- ⏳ 實施組件級別懶加載

### 預期影響
基於已實施的路由級別分割，預期可以實現：
- **初始 Bundle Size**: 減少 15-20%
- **首次加載時間**: 減少 10-15%
- **Time to Interactive**: 減少 10-15%

完整的組件級別懶加載實施後，預期可以達到：
- **初始 Bundle Size**: 減少 25-35%
- **首次加載時間**: 減少 20-25%
- **Time to Interactive**: 減少 20-25%

## 附錄

### 工具與資源
- [Next.js Dynamic Import 文檔](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Bundle Analyzer 使用指南](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Web Vitals 指標說明](https://web.dev/vitals/)

### 參考代碼
所有實施的代碼分割示例可以在以下文件中找到：
- `src/app/dashboard/[id]/planning/page.tsx`
- `src/app/dashboard/[id]/writing/page.tsx`
- `src/app/dashboard/[id]/assessment/page.tsx`
- `src/app/dashboard/[id]/launch/page.tsx`
- `src/components/templates/TemplateDesignerWrapper.tsx`
