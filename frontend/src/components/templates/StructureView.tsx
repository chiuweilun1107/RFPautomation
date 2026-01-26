/**
 * StructureView - 範本結構檢視器
 *
 * 此文件為向後兼容性導出
 * 實際實作已遷移至 ./structure-view/ 目錄
 *
 * 新的模塊化結構:
 * - structure-view/
 *   ├── index.tsx           # 主組件
 *   ├── types.ts            # 類型定義
 *   ├── components/         # 子組件
 *   │   ├── EmptyState.tsx
 *   │   ├── StatsPanel.tsx
 *   │   ├── StyleCard.tsx
 *   │   ├── ParagraphCard.tsx
 *   │   ├── TableCard.tsx
 *   │   ├── SectionCard.tsx
 *   │   └── PageBreaksPanel.tsx
 *   └── utils/              # 工具函數
 *       ├── fontMapping.ts
 *       └── styleConverters.ts
 */

export { StructureView } from './structure-view'
export type { StructureViewProps } from './structure-view/types'
