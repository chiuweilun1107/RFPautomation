# StructureView 架構文檔

## 概述

StructureView 是一個模塊化的 Word 文檔結構分析檢視器，用於顯示範本的樣式、段落、表格、節和換頁資訊。

## 目錄結構

```
structure-view/
├── index.tsx                    # 主組件 (149 行)
├── types.ts                     # 類型定義 (48 行)
├── ARCHITECTURE.md              # 架構文檔
├── components/                  # UI 組件
│   ├── index.ts                 # 組件導出 (7 行)
│   ├── EmptyState.tsx           # 空狀態組件 (12 行)
│   ├── StatsPanel.tsx           # 統計面板 (67 行)
│   ├── StyleCard.tsx            # 樣式卡片 (174 行)
│   ├── ParagraphCard.tsx        # 段落卡片 (136 行)
│   ├── TableCard.tsx            # 表格卡片 (210 行 - 最大)
│   ├── SectionCard.tsx          # 節卡片 (99 行)
│   └── PageBreaksPanel.tsx      # 換頁面板 (25 行)
└── utils/                       # 工具函數
    ├── index.ts                 # 工具導出 (2 行)
    ├── fontMapping.ts           # 字體映射 (23 行)
    └── styleConverters.ts       # 樣式轉換 (62 行)
```

**總計**: 1014 行 (原始: 923 行)

## 組件架構圖

```
┌─────────────────────────────────────────────────────────┐
│                    StructureView                        │
│                     (主組件)                             │
│                                                         │
│  ┌────────────────────────────────────────┐            │
│  │          StatsPanel                     │            │
│  │  - 統計資訊                             │            │
│  │  - 引擎版本                             │            │
│  │  - 合併儲存格計數                       │            │
│  └────────────────────────────────────────┘            │
│                      │                                  │
│                      ▼                                  │
│  ┌────────────────────────────────────────┐            │
│  │              Tabs                       │            │
│  ├────────────────────────────────────────┤            │
│  │                                         │            │
│  │  ┌──────────┐  ┌──────────┐           │            │
│  │  │  樣式    │  │  段落    │           │            │
│  │  │          │  │          │           │            │
│  │  │ Style    │  │Paragraph │           │            │
│  │  │ Card     │  │  Card    │           │            │
│  │  │ (×N)     │  │  (×N)    │           │            │
│  │  └──────────┘  └──────────┘           │            │
│  │                                         │            │
│  │  ┌──────────┐  ┌──────────┐           │            │
│  │  │  表格    │  │   節     │           │            │
│  │  │          │  │          │           │            │
│  │  │  Table   │  │ Section  │           │            │
│  │  │  Card    │  │  Card    │           │            │
│  │  │  (×N)    │  │  (×N)    │           │            │
│  │  └──────────┘  └──────────┘           │            │
│  │                      │                 │            │
│  │                      ├─────────────────┤            │
│  │                      │                 │            │
│  │                      ▼                 │            │
│  │              ┌──────────────┐          │            │
│  │              │ PageBreaks   │          │            │
│  │              │    Panel     │          │            │
│  │              └──────────────┘          │            │
│  │                                         │            │
│  │  ┌──────────┐                          │            │
│  │  │  JSON    │                          │            │
│  │  │  View    │                          │            │
│  │  └──────────┘                          │            │
│  └────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## 資料流

### 1. Props 傳遞流程

```
TemplateDetailView
      │
      ▼
StructureView (主組件)
      │
      ├─► StatsPanel (統計資訊)
      │
      └─► Tabs
          ├─► StyleCard[] (樣式列表)
          ├─► ParagraphCard[] (段落列表)
          ├─► TableCard[] (表格列表)
          ├─► SectionCard[] (節列表)
          │   └─► PageBreaksPanel (換頁資訊)
          └─► JSON View (原始資料)
```

### 2. 樣式轉換流程

```
Word 格式資料
      │
      ▼
utils/styleConverters.ts
      │
      ├─► getRunStyle() → React.CSSProperties
      └─► getTextAlign() → 'left' | 'center' | 'right' | 'justify'
      │
      ▼
組件 style 屬性
      │
      ▼
渲染為 HTML/CSS
```

## 組件職責

### 主組件 (index.tsx)
**職責**: 整合與路由
- ✅ 接收結構資料 props
- ✅ 判斷是否有資料 (顯示 EmptyState)
- ✅ 渲染 StatsPanel
- ✅ 管理 Tabs 導航
- ✅ 委派各卡片組件渲染

### StatsPanel
**職責**: 統計資訊展示
- ✅ 顯示樣式/段落/表格/節/換頁數量
- ✅ 顯示引擎版本
- ✅ 計算合併儲存格數量

### StyleCard
**職責**: 樣式定義可視化
- ✅ 顯示樣式名稱、ID、類型
- ✅ WYSIWYG 預覽
- ✅ 顯示字體、對齊、縮排、間距資訊
- ✅ 標題階層標記

### ParagraphCard
**職責**: 段落內容渲染
- ✅ 顯示段落索引、樣式
- ✅ WYSIWYG 預覽 (支援 runs)
- ✅ 應用對齊、縮排、行距
- ✅ 詳細格式資訊 (可摺疊)

### TableCard
**職責**: 表格結構渲染
- ✅ 顯示表格尺寸 (rows × cols)
- ✅ 渲染完整表格 (支援合併儲存格)
- ✅ 欄寬設定
- ✅ 儲存格格式 (背景色、對齊、垂直對齊)
- ✅ 合併標記顯示 (↔↕)
- ✅ 詳細儲存格資訊 (可摺疊)

### SectionCard
**職責**: 節屬性顯示
- ✅ 顯示節類型、頁面方向
- ✅ 頁面大小、邊距
- ✅ 分欄設定
- ✅ 頁首頁尾數量
- ✅ 頁碼設定

### PageBreaksPanel
**職責**: 換頁位置標記
- ✅ 顯示換頁數量
- ✅ 標記換頁類型 (段落前/內嵌)
- ✅ 標記換頁位置 (段落索引)

### EmptyState
**職責**: 空狀態提示
- ✅ 顯示友好的空狀態訊息
- ✅ 引導用戶等待解析完成

## 工具函數

### fontMapping.ts
**職責**: 字體名稱映射
- ✅ `getFontFamily()`: 將 Word 字體映射到 Web 字體堆疊
- ✅ 支援中文字體 (標楷體、楷體、新細明體、微軟正黑體)
- ✅ 支援英文字體 (Times New Roman、Arial、Calibri、Verdana)

### styleConverters.ts
**職責**: 格式轉換
- ✅ `getRunStyle()`: 將 RunFormat 轉為 React.CSSProperties
- ✅ `getTextAlign()`: 對齊值轉換 (left/center/right/both → CSS 值)

## 類型系統

### 核心類型 (types.ts)

```typescript
// 主組件 Props
interface StructureViewProps {
    styles?: StyleInfo[]
    paragraphs?: ParagraphInfo[]
    tables?: TableInfo[]
    sections?: SectionInfo[]
    pageBreaks?: PageBreakInfo[]
    engine?: string
    version?: string
}

// 組件 Props
interface StyleCardProps { style: StyleInfo }
interface ParagraphCardProps { paragraph: ParagraphInfo }
interface TableCardProps { table: TableInfo }
interface SectionCardProps { section: SectionInfo; index: number }
interface StatsPanelProps { ... }
interface PageBreaksPanelProps { pageBreaks: PageBreakInfo[] }
```

## 效能優化策略

### 1. 組件拆分
✅ 每個卡片類型獨立組件 → 避免重複渲染
✅ 組件大小 < 200 行 → 提升可維護性

### 2. 懶加載與虛擬化
⚠️ **建議**: 長列表 (>100 項) 使用虛擬滾動
- 目前未實作 (資料量通常 < 100)
- 若需要可使用 react-window

### 3. 記憶化
⚠️ **建議**: 使用 React.memo 包裝卡片組件
```typescript
export const StyleCard = React.memo(function StyleCard({ style }) { ... })
```

### 4. 條件渲染
✅ `{hasData ? <Content /> : <EmptyState />}`
✅ `{pageBreaks && <PageBreaksPanel />}`

## 無障礙支援

### 語義 HTML
✅ 使用 `<details>` / `<summary>` 可摺疊內容
✅ 使用 `<table>` 渲染表格結構

### 鍵盤導航
✅ Tabs 使用 Radix UI (完整鍵盤支援)
✅ 所有互動元素可 Tab 存取

### ARIA 標籤
⚠️ **改進空間**:
- 添加 `aria-label` 到統計卡片
- 添加 `role="region"` 到主要區塊

### 對比度
✅ 文字對比度 ≥ 4.5:1 (使用 Tailwind 預設色彩)
✅ 暗色模式支援

## 錯誤處理

### 1. 空資料處理
✅ `if (!hasData) return <EmptyState />`
✅ 各卡片類型檢查資料存在性

### 2. 邊界情況
✅ 空陣列顯示友好訊息
✅ 合併儲存格邏輯防止越界
✅ 可選鏈 `section.pageSize?.orientation`

### 3. 降級策略
✅ 無 runs 時顯示 `paragraph.text`
✅ 無儲存格資料時顯示提示訊息

## 測試策略

### 單元測試
⚠️ **待實作**:
```typescript
// utils/__tests__/fontMapping.test.ts
describe('getFontFamily', () => {
  it('should map 標楷體 to correct font stack', () => {
    expect(getFontFamily('標楷體')).toContain('BiauKai TC')
  })
})

// components/__tests__/StyleCard.test.tsx
describe('StyleCard', () => {
  it('should render style preview', () => {
    render(<StyleCard style={mockStyle} />)
    expect(screen.getByText(/這是使用/)).toBeInTheDocument()
  })
})
```

### 視覺回歸測試
⚠️ **建議**: 使用 Chromatic 或 Playwright
- 測試各卡片渲染
- 測試合併儲存格顯示
- 測試暗色模式

## 向後兼容性

舊的導入方式仍然有效:

```typescript
// 舊方式 (仍支援)
import { StructureView } from '@/components/templates/StructureView'

// 新方式 (推薦)
import { StructureView } from '@/components/templates/structure-view'
```

StructureView.tsx 作為兼容層存在。

## 未來改進

### 1. 效能優化
- [ ] 使用 React.memo 包裝卡片組件
- [ ] 長列表虛擬滾動 (react-window)
- [ ] 使用 useMemo 快取計算值

### 2. 功能增強
- [ ] 搜尋/過濾功能
- [ ] 匯出為 Markdown/HTML
- [ ] 樣式對比工具
- [ ] 表格編輯器

### 3. 無障礙改進
- [ ] 完整 ARIA 標籤
- [ ] 鍵盤快捷鍵
- [ ] 螢幕閱讀器優化

### 4. 測試覆蓋
- [ ] 單元測試 (≥ 70%)
- [ ] 視覺回歸測試
- [ ] E2E 測試 (Playwright)

---

**設計原則**:
1. ✅ **模塊化**: 組件獨立、可重用
2. ✅ **類型安全**: 完整 TypeScript 類型
3. ✅ **關注點分離**: UI / 邏輯 / 工具函數分離
4. ✅ **可維護性**: 組件 < 200 行
5. ✅ **用戶體驗**: WYSIWYG 預覽、友好提示
