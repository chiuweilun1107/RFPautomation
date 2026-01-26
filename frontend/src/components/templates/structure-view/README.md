# StructureView - Word 文檔結構檢視器

模塊化的 Word 文檔結構分析檢視器，用於顯示範本的樣式、段落、表格、節和換頁資訊。

## 快速開始

### 基本使用

```typescript
import { StructureView } from '@/components/templates/structure-view'

// 使用組件
<StructureView
  styles={template.structure?.styles}
  paragraphs={template.structure?.paragraphs}
  tables={template.structure?.tables}
  sections={template.structure?.sections}
  pageBreaks={template.structure?.pageBreaks}
  engine="easy-template-x"
  version="v2"
/>
```

### 向後兼容導入

```typescript
// 舊方式 (仍支援)
import { StructureView } from '@/components/templates/StructureView'

// 新方式 (推薦)
import { StructureView } from '@/components/templates/structure-view'
```

## 目錄結構

```
structure-view/
├── index.tsx                    # 主組件 (149 行)
├── types.ts                     # 類型定義 (48 行)
├── README.md                    # 本文件
├── ARCHITECTURE.md              # 詳細架構文檔
├── MIGRATION_REPORT.md          # 拆分遷移報告
├── components/                  # UI 組件
│   ├── index.ts                 # 組件導出
│   ├── EmptyState.tsx           # 空狀態組件
│   ├── StatsPanel.tsx           # 統計面板
│   ├── StyleCard.tsx            # 樣式卡片
│   ├── ParagraphCard.tsx        # 段落卡片
│   ├── TableCard.tsx            # 表格卡片
│   ├── SectionCard.tsx          # 節卡片
│   └── PageBreaksPanel.tsx      # 換頁面板
└── utils/                       # 工具函數
    ├── index.ts                 # 工具導出
    ├── fontMapping.ts           # 字體映射
    └── styleConverters.ts       # 樣式轉換
```

## 主要功能

### 1. 樣式定義可視化
- 顯示所有樣式定義 (名稱、ID、類型)
- WYSIWYG 樣式預覽
- 字體、對齊、縮排、間距資訊
- 標題階層標記

### 2. 段落內容渲染
- 段落索引與樣式顯示
- WYSIWYG 預覽 (支援 runs 格式化)
- 對齊、縮排、行距應用
- 詳細格式資訊 (可摺疊)

### 3. 表格結構渲染
- 表格尺寸顯示 (rows × cols)
- 完整表格渲染 (支援合併儲存格)
- 欄寬設定
- 儲存格格式 (背景色、對齊)
- 合併標記顯示 (↔ 橫向, ↕ 縱向)

### 4. 節屬性顯示
- 節類型、頁面方向
- 頁面大小、邊距
- 分欄設定
- 頁首頁尾、頁碼設定

### 5. 換頁位置標記
- 換頁數量統計
- 換頁類型 (段落前/內嵌)
- 換頁位置 (段落索引)

### 6. JSON 結構檢視
- 原始資料完整顯示
- 便於除錯與開發

## Props 介面

```typescript
interface StructureViewProps {
    // 樣式定義列表
    styles?: StyleInfo[]

    // 段落資訊列表
    paragraphs?: ParagraphInfo[]

    // 表格資訊列表
    tables?: TableInfo[]

    // 節資訊列表
    sections?: SectionInfo[]

    // 換頁位置列表
    pageBreaks?: PageBreakInfo[]

    // 解析引擎名稱
    engine?: string

    // 引擎版本
    version?: string
}
```

## 工具函數

### fontMapping.ts

```typescript
// 將 Word 字體名稱映射到 Web 字體堆疊
import { getFontFamily } from './utils/fontMapping'

getFontFamily('標楷體')
// 返回: '"BiauKai TC", "BiauKai HK", "標楷體-繁", ...'
```

**支援字體**:
- 中文: 標楷體、楷體、新細明體、微軟正黑體
- 英文: Times New Roman、Arial、Calibri、Verdana

### styleConverters.ts

```typescript
import { getRunStyle, getTextAlign } from './utils/styleConverters'

// 將 RunFormat 轉為 CSS 樣式
const style = getRunStyle(run.format)
// 返回: React.CSSProperties

// 對齊值轉換
const align = getTextAlign('both')
// 返回: 'justify'
```

## 組件拆分

### 組件大小

| 組件 | 行數 | 職責 |
|------|------|------|
| index.tsx | 149 | 主組件整合 |
| EmptyState | 12 | 空狀態 UI |
| StatsPanel | 67 | 統計資訊 |
| StyleCard | 174 | 樣式卡片 |
| ParagraphCard | 136 | 段落卡片 |
| TableCard | 210 | 表格卡片 |
| SectionCard | 99 | 節卡片 |
| PageBreaksPanel | 25 | 換頁面板 |

**所有組件 ≤ 210 行** ✅

### 設計原則

1. **關注點分離**: UI / 邏輯 / 工具函數分離
2. **單一職責**: 每個組件只做一件事
3. **可組合性**: 組件可獨立使用和測試
4. **類型安全**: 完整的 TypeScript 類型定義

## 效能優化

### 已實作
✅ 組件拆分 (避免重複渲染)
✅ 條件渲染 (hasData 檢查)
✅ 可摺疊詳細資訊 (減少初始渲染)

### 建議優化
⚠️ 使用 React.memo 包裝卡片組件
⚠️ 長列表虛擬滾動 (如 paragraphs > 100)
⚠️ 使用 useMemo 快取計算值

## 無障礙支援

### 已實作
✅ 語義 HTML (`<details>`, `<summary>`, `<table>`)
✅ 鍵盤導航 (Tabs 使用 Radix UI)
✅ 暗色模式支援
✅ 對比度 ≥ 4.5:1

### 待改進
⚠️ 添加 ARIA 標籤
⚠️ 鍵盤快捷鍵
⚠️ 螢幕閱讀器優化

## 測試

### 手動測試清單

- [ ] 載入有完整資料的範本
  - [ ] 樣式頁籤顯示正常
  - [ ] 段落頁籤 WYSIWYG 預覽正確
  - [ ] 表格頁籤合併儲存格顯示正確
  - [ ] 節頁籤資訊完整
  - [ ] JSON 頁籤資料正確

- [ ] 載入空範本
  - [ ] 顯示 EmptyState

- [ ] 樣式測試
  - [ ] 字體映射正確 (中文字體)
  - [ ] 顏色顯示正確
  - [ ] 對齊方式正確

- [ ] 暗色模式
  - [ ] 所有組件暗色模式正常

### 自動化測試 (待實作)

```typescript
// 範例測試
describe('StructureView', () => {
  it('should render EmptyState when no data', () => {
    render(<StructureView />)
    expect(screen.getByText(/尚未解析/)).toBeInTheDocument()
  })

  it('should render styles tab', () => {
    render(<StructureView styles={mockStyles} />)
    expect(screen.getByText(/共 3 個樣式定義/)).toBeInTheDocument()
  })
})
```

## 常見問題

### Q: 為什麼拆分成這麼多文件?
A: 遵循前端開發規範,每個文件 < 200 行,提升可維護性與代碼品質。

### Q: 舊的導入路徑還能用嗎?
A: 可以。`StructureView.tsx` 作為兼容層存在,舊代碼無需修改。

### Q: TableCard 為什麼是 210 行?
A: 表格渲染邏輯複雜 (支援合併儲存格),已最簡化。可接受範圍內。

### Q: 如何添加新功能?
A: 根據功能類型選擇:
- UI 組件 → 添加到 `components/`
- 工具函數 → 添加到 `utils/`
- 類型定義 → 添加到 `types.ts`

## 參考文檔

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 詳細架構設計
- [MIGRATION_REPORT.md](./MIGRATION_REPORT.md) - 拆分遷移報告
- [proposal-editor](../workspace/proposal-editor/) - 參考案例

## 維護者

**前端工程師 Ava**

如有問題,請參考架構文檔或聯繫維護團隊。
