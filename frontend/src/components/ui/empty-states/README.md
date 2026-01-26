# Empty States Components - Quick Reference

**設計系統**: Brutalist/Swiss Design
**維護者**: UI/UX 設計師 Mia

---

## 📦 組件清單

### 核心組件
- `BrutalistEmptyState` - 通用空狀態組件

### 領域專用組件
- `TemplateEmptyState` - 模板列表
- `KnowledgeEmptyState` - 知識庫
- `SourceEmptyState` - 來源管理
- `ProposalEmptyState` - 提案編輯器
- `ProjectEmptyState` - 項目列表

### 快捷組件
- `NoDataEmptyState` - 通用無數據
- `FilteredEmptyState` - 過濾無結果
- `ErrorEmptyState` - 錯誤狀態

---

## 🚀 快速開始

### 安裝
```tsx
import { BrutalistEmptyState, TemplateEmptyState } from '@/components/ui/empty-states';
```

### 基礎使用
```tsx
<BrutalistEmptyState
  icon={FileText}
  title="NO DATA FOUND"
  description="Start by adding your first item."
  variant="boxed"
  action={{
    label: 'Add Item',
    onClick: handleAdd,
    icon: Plus
  }}
/>
```

### 領域專用
```tsx
<TemplateEmptyState
  onUpload={handleUpload}
  isFiltered={!!searchQuery}
/>
```

---

## 📖 Props 參考

### BrutalistEmptyState

```typescript
interface BrutalistEmptyStateProps {
  // 圖標 (來自 lucide-react)
  icon?: LucideIcon;

  // 主標題 (必填)
  title: string;

  // 描述文字
  description?: string;

  // 主要行動按鈕
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };

  // 次要行動按鈕
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };

  // 自定義樣式
  className?: string;

  // 視覺變體
  variant?: 'default' | 'minimal' | 'boxed';

  // 狀態類型
  stateType?: 'empty' | 'error' | 'filtered' | 'processing';
}
```

### 領域專用組件 Props

```typescript
// TemplateEmptyState
interface TemplateEmptyStateProps {
  onUpload?: () => void;
  isFiltered?: boolean;
}

// SourceEmptyState
interface SourceEmptyStateProps {
  onAddSource?: () => void;
  onAISearch?: () => void;
  isFiltered?: boolean;
}

// ProposalEmptyState
interface ProposalEmptyStateProps {
  onAddSection?: () => void;
  onUseTemplate?: () => void;
}
```

---

## 🎨 設計規範

### 變體 (Variants)

#### default
- 無邊框背景
- 適合獨立頁面
- 較大的間距

#### minimal
- 緊湊佈局
- 較小的圖標與文字
- 適合嵌入組件

#### boxed
- 虛線邊框 + 淺色背景
- 明確的視覺邊界
- 推薦用於列表空狀態

### 狀態類型 (State Types)

#### empty
- 灰色圖標 (opacity 40%)
- 用於正常空狀態

#### error
- Swiss Red 圖標
- 用於錯誤/失敗狀態

#### filtered
- 較深灰色 (opacity 60%)
- 用於搜索/過濾無結果

#### processing
- 黃色圖標
- 用於加載/處理中

---

## 💡 使用範例

### 範例 1: 簡單列表空狀態
```tsx
function TemplateList({ templates }) {
  if (templates.length === 0) {
    return (
      <BrutalistEmptyState
        icon={FileText}
        title="NO TEMPLATES"
        description="Upload a DOCX template to get started."
        variant="boxed"
        stateType="empty"
      />
    );
  }

  return <div>{/* 列表渲染 */}</div>;
}
```

### 範例 2: 過濾狀態
```tsx
function SearchResults({ results, query }) {
  if (results.length === 0 && query) {
    return (
      <BrutalistEmptyState
        icon={Search}
        title="NO MATCHES FOUND"
        description={`No results for "${query}". Try different keywords.`}
        variant="default"
        stateType="filtered"
        action={{
          label: 'Clear Search',
          onClick: () => setQuery(''),
          icon: X
        }}
      />
    );
  }

  return <div>{/* 結果渲染 */}</div>;
}
```

### 範例 3: 雙按鈕操作
```tsx
function SourceList({ sources }) {
  if (sources.length === 0) {
    return (
      <BrutalistEmptyState
        icon={Globe}
        title="NO SOURCES FOUND"
        description="Build your knowledge base by uploading files or using AI search."
        variant="boxed"
        stateType="empty"
        action={{
          label: 'AI Search',
          onClick: handleAISearch,
          icon: Sparkles
        }}
        secondaryAction={{
          label: 'Add Source',
          onClick: handleAddSource,
          icon: Plus
        }}
      />
    );
  }

  return <div>{/* 來源列表 */}</div>;
}
```

### 範例 4: 錯誤狀態
```tsx
function DataView({ data, error }) {
  if (error) {
    return (
      <BrutalistEmptyState
        icon={AlertCircle}
        title="LOAD FAILED"
        description="Unable to fetch data. Check your connection and try again."
        variant="boxed"
        stateType="error"
        action={{
          label: 'Retry',
          onClick: handleRetry,
          icon: RefreshCw
        }}
      />
    );
  }

  return <div>{data}</div>;
}
```

### 範例 5: 使用領域組件
```tsx
function TemplateFolder({ templates, searchQuery }) {
  if (templates.length === 0) {
    return (
      <TemplateEmptyState
        onUpload={handleUpload}
        isFiltered={!!searchQuery}
      />
    );
  }

  return <div>{/* 模板列表 */}</div>;
}
```

---

## ✅ 最佳實踐

### DO ✅

1. **使用語義化圖標**
   ```tsx
   <BrutalistEmptyState
     icon={FileText}  // ✅ 文件相關用 FileText
     title="NO FILES"
   />
   ```

2. **提供明確操作指引**
   ```tsx
   <BrutalistEmptyState
     title="NO DATA"
     description="Upload a file or create manually to get started."  // ✅ 告訴用戶怎麼做
     action={{ label: 'Upload', onClick: handleUpload }}
   />
   ```

3. **區分空狀態與過濾狀態**
   ```tsx
   {filteredData.length === 0 && !query && (
     <BrutalistEmptyState stateType="empty" />  // ✅ 真正的空
   )}
   {filteredData.length === 0 && query && (
     <BrutalistEmptyState stateType="filtered" />  // ✅ 過濾無結果
   )}
   ```

4. **使用適當的變體**
   ```tsx
   // ✅ 列表頁面用 boxed
   <BrutalistEmptyState variant="boxed" />

   // ✅ 獨立頁面用 default
   <BrutalistEmptyState variant="default" />

   // ✅ 嵌入組件用 minimal
   <BrutalistEmptyState variant="minimal" />
   ```

### DON'T ❌

1. **不要使用不相關的圖標**
   ```tsx
   // ❌ 檔案列表用笑臉圖標
   <BrutalistEmptyState icon={Smile} title="NO FILES" />
   ```

2. **不要省略描述**
   ```tsx
   // ❌ 只有標題，用戶不知道下一步
   <BrutalistEmptyState title="EMPTY" />

   // ✅ 提供完整資訊
   <BrutalistEmptyState
     title="NO DATA"
     description="Upload files to get started."
   />
   ```

3. **不要混用狀態類型**
   ```tsx
   // ❌ 錯誤狀態用 empty
   <BrutalistEmptyState stateType="empty" title="LOAD FAILED" />

   // ✅ 使用正確的狀態
   <BrutalistEmptyState stateType="error" title="LOAD FAILED" />
   ```

---

## 🎯 選擇指南

### 何時使用通用組件 `BrutalistEmptyState`

- ✅ 需要自定義狀態
- ✅ 特殊業務場景
- ✅ 需要完全控制 Props

### 何時使用領域專用組件

- ✅ 標準列表頁面
- ✅ 快速開發
- ✅ 保持設計一致性

### 何時使用快捷組件

- ✅ 通用場景 (NoDataEmptyState)
- ✅ 搜索結果 (FilteredEmptyState)
- ✅ 錯誤處理 (ErrorEmptyState)

---

## 🔧 自定義擴展

### 創建自定義空狀態
```tsx
import { BrutalistEmptyState } from '@/components/ui/empty-states';
import { Database } from 'lucide-react';

export function DatabaseEmptyState({ onConnect }: { onConnect?: () => void }) {
  return (
    <BrutalistEmptyState
      icon={Database}
      title="NO CONNECTION"
      description="Database connection failed. Check your credentials and try again."
      variant="boxed"
      stateType="error"
      action={onConnect ? {
        label: 'Reconnect',
        onClick: onConnect,
        icon: RefreshCw
      } : undefined}
    />
  );
}
```

### 添加自定義樣式
```tsx
<BrutalistEmptyState
  className="my-custom-spacing"
  title="CUSTOM EMPTY STATE"
  // ...
/>
```

---

## 🎨 設計 Token

### 顏色
```css
/* 空狀態圖標 */
--empty-icon: oklch(0 0 0 / 0.2);      /* 20% 黑色 */
--error-icon: oklch(0.58 0.23 27.5);   /* Swiss Red */
--filtered-icon: oklch(0 0 0 / 0.3);   /* 30% 黑色 */

/* 邊框與背景 */
--empty-border: oklch(0 0 0 / 0.1);    /* 10% 黑色 */
--empty-bg: oklch(0 0 0 / 0.05);       /* 5% 黑色 */
```

### 間距
```css
/* 變體間距 */
--minimal-spacing: 2rem;    /* py-8 */
--default-spacing: 4rem;    /* py-16 */
--boxed-spacing: 3rem;      /* p-12 */
```

### 圖標大小
```css
--minimal-icon: 3rem;       /* 48px */
--default-icon: 4rem;       /* 64px */
--large-icon: 5rem;         /* 80px */
```

---

## 📚 參考資源

### 相關文檔
- **設計系統**: `/frontend/src/app/globals.css`
- **改善報告**: `/UI_UX_IMPROVEMENT_REPORT.md`
- **響應式指南**: `/RESPONSIVE_FIX_CHECKLIST.md`

### 設計原則
- **Brutalist Design**: 高對比、無圓角、粗邊框
- **Swiss Typography**: 大寫、Mono 字體、緊密間距
- **OKLCH 顏色**: 感知均勻的顏色空間

### 無障礙標準
- **WCAG 2.1 AA**: 對比度 ≥ 4.5:1
- **ARIA Labels**: 為圖標添加語義
- **鍵盤導航**: 按鈕可 Tab 聚焦

---

## 🐛 常見問題

### Q: 圖標沒有顯示
A: 確保已從 `lucide-react` 導入圖標
```tsx
import { FileText } from 'lucide-react';
```

### Q: 按鈕樣式不對
A: 檢查是否傳入了 `action` prop
```tsx
action={{
  label: 'Add Item',
  onClick: handleAdd,
  icon: Plus  // 可選
}}
```

### Q: 移動端顯示異常
A: 組件已內建響應式，檢查父容器是否有固定寬度

### Q: 如何修改配色
A: 使用 `stateType` prop 或添加自定義 `className`

---

## 📝 更新日誌

### v1.0.0 (2026-01-26)
- ✅ 初始發布
- ✅ 創建核心組件 BrutalistEmptyState
- ✅ 創建 5 個領域專用組件
- ✅ 創建 3 個快捷組件
- ✅ 完整 TypeScript 型別支援
- ✅ 響應式設計
- ✅ 無障礙支持

---

**維護者**: UI/UX 設計師 Mia
**最後更新**: 2026-01-26

如有任何問題或建議，歡迎反饋！
