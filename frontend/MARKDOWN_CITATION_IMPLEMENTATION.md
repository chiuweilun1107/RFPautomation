# Markdown with Citations Implementation

## 概述

實現了使用 ReactMarkdown 渲染器來解決標書規劃模組中的 Markdown 格式問題。

## 問題診斷

### 根本原因
- **WF11 和 WF13 的 LLM 提示詞要求輸出標準 Markdown 格式**：
  - 使用編號列表 `1.` `2.` `3.`
  - 列表項目之間必須有空行（雙換行 `\n\n`）
  - 支持 `**粗體**` 等 Markdown 語法

- **前端使用 CitationRenderer 只是簡單的文本渲染**：
  - ❌ 無法渲染 Markdown 語法（`**粗體**` 顯示為原始文本）
  - ❌ 依賴 LLM 嚴格輸出雙換行，但 LLM 並不總是遵守
  - ❌ 當 LLM 輸出不規範時，內容會擠在一起

## 解決方案

### 1. 創建 MarkdownWithCitations 組件

**文件路徑**：`frontend/src/components/workspace/MarkdownWithCitations.tsx`

**功能特性**：
- ✅ 使用 ReactMarkdown 正確解析和渲染 Markdown 語法
- ✅ 使用 remark-gfm 支持 GitHub Flavored Markdown
- ✅ 保留原有的引用徽章（CitationBadge）功能
- ✅ 支持在文本、列表、粗體、斜體等任何位置插入引用徽章
- ✅ 自動處理列表格式，即使 LLM 只輸出單換行

**支持的 Markdown 元素**：
- 標題（H1-H4）
- 編號列表（Ordered Lists）
- 無序列表（Unordered Lists）
- 粗體（Bold）
- 斜體（Italic）
- 內聯代碼（Inline Code）
- 代碼塊（Code Blocks）
- 引用（Blockquotes）
- 引用徽章（Citation Badges）

### 2. 更新 DraggableTaskPopup

**文件路徑**：`frontend/src/components/workspace/tender-planning/components/DraggableTaskPopup.tsx`

**修改內容**：
```typescript
// 原來：
import { CitationRenderer } from "@/components/workspace/CitationRenderer";

// 改為：
import { MarkdownWithCitations } from "@/components/workspace/MarkdownWithCitations";

// 原來：
<CitationRenderer
    text={convertedText}
    evidences={evidences}
    onCitationClick={(evidence) => handleCitationClick(evidence)}
/>

// 改為：
<MarkdownWithCitations
    text={convertedText}
    evidences={evidences}
    onCitationClick={(evidence) => handleCitationClick(evidence)}
/>
```

### 3. 測試覆蓋

**測試文件**：`frontend/src/__tests__/components/workspace/MarkdownWithCitations.test.tsx`

**測試結果**：✅ 14/14 測試通過

**測試覆蓋範圍**：
- ✅ Markdown 渲染（標題、列表、粗體、代碼等）
- ✅ 引用徽章渲染（純文本、列表、粗體內）
- ✅ 引用點擊處理
- ✅ 複雜混合內容

```bash
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

## 實現優勢

### 1. 解決格式問題
- **自動處理列表格式**：即使 LLM 輸出不規範（單換行而非雙換行），Markdown 解析器也能正確渲染
- **正確渲染 Markdown 語法**：`**粗體**`、`*斜體*`、`` `代碼` `` 等都能正確顯示

### 2. 保留原有功能
- **引用徽章完全兼容**：引用 `[1]` `[2]` 仍然渲染為可點擊的徽章
- **引用面板正常工作**：點擊徽章可以打開引用詳情面板
- **樣式保持一致**：使用 Tailwind 的 prose 類保持視覺一致性

### 3. 可維護性提升
- **標準化解決方案**：使用業界標準的 react-markdown 庫
- **可擴展性**：輕鬆添加更多 Markdown 功能（表格、圖片等）
- **測試覆蓋**：完整的單元測試確保功能穩定

## 技術架構

### 組件結構
```
MarkdownWithCitations
├── ReactMarkdown (核心 Markdown 解析器)
│   ├── remarkGfm (GitHub Flavored Markdown 支持)
│   └── Custom Components (自定義渲染器)
│       ├── p (段落 - 處理引用)
│       ├── ol/ul (列表)
│       ├── li (列表項 - 處理引用)
│       ├── strong/em (粗體/斜體 - 處理引用)
│       ├── code (代碼)
│       └── h1-h4 (標題)
└── processCitationText (引用處理函數)
    └── CitationBadge (引用徽章組件)
```

### 引用處理流程
1. ReactMarkdown 解析 Markdown 文本
2. 自定義 components 攔截文本節點
3. `processCitationText` 識別 `[數字]` 模式
4. 根據 evidences 查找對應的引用資料
5. 渲染 CitationBadge 或純文本

## 部署驗證

### 開發服務器狀態
```bash
✓ Ready in 415ms
✓ No compilation errors
✓ All routes accessible
```

### TypeScript 檢查
- ✅ 新組件無類型錯誤
- ✅ 與現有代碼完全兼容
- ✅ 導入路徑正確

### 單元測試
```bash
✓ 14/14 tests passed
✓ All test suites passed
✓ No test failures
```

## 使用示例

### 基本用法
```tsx
import { MarkdownWithCitations } from '@/components/workspace/MarkdownWithCitations';

<MarkdownWithCitations
    text="這是需求說明 [1]：\n\n1. **第一個需求** [2]\n2. 第二個需求"
    evidences={evidencesMap}
    onCitationClick={handleClick}
/>
```

### 輸入示例
```markdown
# 專案需求

這是需求說明 [1]：

1. **第一個需求** [2]
2. 第二個需求
3. 包含 `代碼` 的需求 [3]

引用文件 [1] 顯示重要資訊。
```

### 渲染結果
- ✅ 標題正確渲染為 H1
- ✅ 列表自動編號並正確間距
- ✅ 粗體文字正確顯示
- ✅ 內聯代碼顯示為灰色背景
- ✅ 引用 [1] [2] [3] 渲染為可點擊的徽章

## 向後兼容性

### CitationRenderer 保留
- ✅ 原有的 `CitationRenderer.tsx` 文件保留
- ✅ 其他使用 CitationRenderer 的地方不受影響
- ✅ 可以逐步遷移到 MarkdownWithCitations

### API 兼容性
```typescript
// 完全相同的 API
interface Props {
    text: string;
    evidences?: Record<string | number, Evidence>;
    onCitationClick?: (evidence: Evidence) => void;
}
```

## 性能考量

### 優化措施
- ✅ 使用 `React.useMemo` 緩存自定義組件配置
- ✅ CitationBadge 組件已使用 `React.memo` 優化
- ✅ 避免不必要的重新渲染

### 依賴大小
- react-markdown: ~45KB (gzipped)
- remark-gfm: ~12KB (gzipped)
- 總增加: ~57KB

## 後續優化建議

### 短期（可選）
1. 添加更多 Markdown 功能（表格、圖片）
2. 自定義樣式主題
3. 支持 Markdown 編輯器

### 長期（可選）
1. 支持 LaTeX 數學公式
2. 支持 Mermaid 圖表
3. 支持語法高亮

## 結論

✅ **實現成功**：成功使用 ReactMarkdown 替代簡單的文本渲染器
✅ **功能完整**：保留所有引用徽章功能，並支持完整的 Markdown 語法
✅ **測試充分**：14 個單元測試全部通過
✅ **代碼質量**：TypeScript 類型完整，代碼結構清晰
✅ **部署就緒**：開發服務器正常運行，無編譯錯誤

**下一步**：
1. 在實際環境中測試引用徽章點擊功能
2. 驗證與 WF11/WF13 生成內容的兼容性
3. 收集用戶反饋並進行優化
