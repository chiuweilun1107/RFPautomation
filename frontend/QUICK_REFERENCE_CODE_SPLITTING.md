# 代碼分割快速參考指南

**適用於**: Next.js 16 + React 19 + TypeScript
**更新日期**: 2026-01-26

---

## 🚀 快速開始

### 基本懶加載語法

```typescript
import dynamic from 'next/dynamic'

const MyComponent = dynamic(() => import('./MyComponent'))
```

### 帶 Loading 狀態

```typescript
const MyComponent = dynamic(
  () => import('./MyComponent'),
  {
    loading: () => <div>載入中...</div>,
    ssr: false  // 可選：禁用服務端渲染
  }
)
```

---

## 📋 常見場景範例

### 1. 頁面級別懶加載

```typescript
// src/app/page.tsx
"use client"

import dynamic from 'next/dynamic'
import { ContentSkeleton } from '@/components/ui/skeletons/ContentSkeleton'

const HeavyPageComponent = dynamic(
  () => import('@/components/HeavyPageComponent'),
  {
    loading: () => <ContentSkeleton />,
    ssr: false
  }
)

export default function Page() {
  return <HeavyPageComponent />
}
```

### 2. Dialog 組件懶加載

```typescript
"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'

const CreateDialog = dynamic(() => import('@/components/CreateDialog'))

export function PageWithDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打開</button>
      {isOpen && <CreateDialog onClose={() => setIsOpen(false)} />}
    </>
  )
}
```

### 3. 編輯器組件懶加載

```typescript
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(
  () => import('@/components/RichTextEditor'),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <span>載入編輯器...</span>
      </div>
    ),
    ssr: false  // 編輯器通常依賴瀏覽器 API
  }
)
```

### 4. 第三方庫懶加載

```typescript
import dynamic from 'next/dynamic'

// React Markdown
const ReactMarkdown = dynamic(() => import('react-markdown'))

// Chart 庫
const Chart = dynamic(() => import('react-chartjs-2'))

// PDF Viewer
const PDFViewer = dynamic(() => import('@react-pdf/renderer'))
```

### 5. 命名導出懶加載

```typescript
// 如果組件不是 default export
const MyComponent = dynamic(
  () => import('./MyComponent').then(mod => ({ default: mod.MyComponent }))
)
```

### 6. 多個組件同時懶加載

```typescript
import dynamic from 'next/dynamic'

const [Editor, Toolbar, Sidebar] = [
  dynamic(() => import('@/components/Editor')),
  dynamic(() => import('@/components/Toolbar')),
  dynamic(() => import('@/components/Sidebar'))
]
```

---

## 🎨 Loading 組件範例

### 1. 簡單 Spinner

```typescript
loading: () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
)
```

### 2. Skeleton 佔位符

```typescript
loading: () => (
  <div className="space-y-4 p-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse" />
    <div className="h-64 bg-gray-200 rounded animate-pulse" />
    <div className="h-10 bg-gray-200 rounded animate-pulse w-1/4" />
  </div>
)
```

### 3. 無障礙 Loading

```typescript
loading: () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="載入中"
    className="flex items-center justify-center h-64"
  >
    <LoadingSpinner />
    <span className="sr-only">載入中...</span>
  </div>
)
```

---

## 🔧 next.config.ts 優化配置

```typescript
import type { NextConfig } from "next"
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      // Icons
      "lucide-react",
      "@radix-ui/react-icons",

      // UI Components
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",

      // Markdown & Editor
      "react-markdown",
      "@tiptap/react",
      "@tiptap/starter-kit",
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  productionBrowserSourceMaps: false,

  images: {
    formats: ["image/avif", "image/webp"],
  },
}

export default withBundleAnalyzer(nextConfig)
```

---

## 📊 性能測試命令

### Bundle 分析

```bash
# 分析 bundle size
npm run analyze

# 或直接運行
ANALYZE=true npm run build
```

### Lighthouse 測試

```bash
# Chrome DevTools
1. F12 打開 DevTools
2. Lighthouse 標籤
3. 選擇 "Performance" + "Desktop"
4. 點擊 "Analyze page load"
```

---

## ⚠️ 常見錯誤與解決方案

### 錯誤 1: "Hydration failed"

**原因**: 服務端和客戶端渲染不一致

**解決方案**:
```typescript
const Component = dynamic(
  () => import('./Component'),
  { ssr: false }  // 禁用 SSR
)
```

### 錯誤 2: "Cannot find module"

**原因**: 動態導入路徑錯誤

**解決方案**:
```typescript
// ❌ 錯誤
dynamic(() => import('Component'))

// ✅ 正確
dynamic(() => import('./Component'))
dynamic(() => import('@/components/Component'))
```

### 錯誤 3: Loading 狀態閃爍

**原因**: 組件加載太快

**解決方案**:
```typescript
// 添加最小顯示時間
const Component = dynamic(
  () => Promise.all([
    import('./Component'),
    new Promise(resolve => setTimeout(resolve, 300))
  ]).then(([module]) => module),
  { loading: () => <Skeleton /> }
)
```

### 錯誤 4: TypeScript 類型錯誤

**原因**: 動態導入丟失類型

**解決方案**:
```typescript
import type { ComponentProps } from './Component'

const Component = dynamic<ComponentProps>(
  () => import('./Component')
)
```

---

## 🎯 優化決策樹

```
是否需要懶加載？
│
├─ 組件 < 100行 → ❌ 不需要
│
├─ 組件在首屏 → ❌ 不需要
│
├─ 組件 > 500行 → ✅ 強烈建議
│
├─ Dialog/Modal → ✅ 建議
│
├─ 編輯器組件 → ✅ 建議
│
├─ 圖表/可視化 → ✅ 建議
│
└─ 第三方庫 > 50KB → ✅ 建議
```

---

## 📏 性能目標

| 指標 | 良好 | 需改善 |
|------|------|--------|
| FCP | < 1.8s | > 3.0s |
| LCP | < 2.5s | > 4.0s |
| TTI | < 3.8s | > 7.3s |
| CLS | < 0.1 | > 0.25 |
| Bundle Size (gzipped) | < 500KB | > 1MB |

---

## 🔍 檢查清單

### 實施前
- [ ] 確認組件大小（> 500行或 > 50KB）
- [ ] 確認組件不在首屏
- [ ] 準備好 loading 組件
- [ ] 確認類型定義完整

### 實施後
- [ ] 運行 `npm run build` 檢查構建成功
- [ ] 運行 `npm run analyze` 檢查 bundle size
- [ ] 測試 loading 狀態顯示正常
- [ ] 測試組件功能正常
- [ ] 檢查無障礙性（keyboard navigation, screen reader）
- [ ] 運行 Lighthouse 測試

---

## 💡 進階技巧

### 1. 預加載（Prefetch）

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'))

// 在用戶可能需要之前預加載
function PreloadExample() {
  return (
    <button
      onMouseEnter={() => import('./HeavyComponent')}
      onClick={() => setShowComponent(true)}
    >
      打開組件
    </button>
  )
}
```

### 2. 條件加載

```typescript
import dynamic from 'next/dynamic'

function ConditionalLoad({ userRole }: { userRole: string }) {
  const AdminPanel = userRole === 'admin'
    ? dynamic(() => import('./AdminPanel'))
    : null

  return AdminPanel ? <AdminPanel /> : <div>無權限</div>
}
```

### 3. 漸進式增強

```typescript
import dynamic from 'next/dynamic'

const EnhancedFeature = dynamic(
  () => import('./EnhancedFeature'),
  {
    loading: () => <BasicFeature />,  // 降級體驗
    ssr: false
  }
)
```

---

## 📚 相關資源

- [Next.js Dynamic Import](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React.lazy](https://react.dev/reference/react/lazy)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

**快速參考指南** | 更新於 2026-01-26
