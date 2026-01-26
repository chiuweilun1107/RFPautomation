# 需求出處標註功能使用指南

## 📋 概述

本功能自動在需求文本末尾附加出處標註，格式為：`(出處：文件名 P.頁碼)`

**範例輸出**：
```
新系統應符合新北市政府動物保護防疫處多元組織業務需求，包括動物疾病衛生保健、檢診、調查、管理及教育宣導等，以支援日漸成長的救援及陳情案件量，預估每年合計約2萬件案量，需透過資訊科技提升作業自動化與流程標準化 (出處：3-需求說明書.docx P.1)。
```

---

## 🚀 快速開始

### 1. 基本使用

```typescript
import { appendSourceToRequirement } from './requirementSourceFormatter';

const task = {
  requirement_text: "本專案緣起於現有業務系統未整合，導致管理效能不彰",
  citations: [
    {
      source_id: "uuid-123",
      page: 1,
      title: "3-需求說明書.docx",
      quote: "..."
    }
  ]
};

// 格式化需求文本
const formattedText = appendSourceToRequirement(
  task.requirement_text,
  task.citations
);

console.log(formattedText);
// 輸出: "本專案緣起於現有業務系統未整合，導致管理效能不彰 (出處：3-需求說明書.docx P.1)。"
```

### 2. 在 React 組件中使用

```tsx
import { appendSourceToRequirement } from './requirementSourceFormatter';

function RequirementDisplay({ task }: { task: Task }) {
  const formattedText = appendSourceToRequirement(
    task.requirement_text,
    task.citations || []
  );

  return (
    <div className="requirement-box">
      <h3>需求規格</h3>
      <p>{formattedText}</p>
    </div>
  );
}
```

---

## 📚 API 參考

### `appendSourceToRequirement()`

在需求文本末尾附加出處標註。

**簽名**：
```typescript
function appendSourceToRequirement(
  requirementText: string,
  citations: Citation[]
): string
```

**參數**：
- `requirementText`: 原始需求文本
- `citations`: 引用信息數組

**返回**：附加出處後的完整文本

**範例**：
```typescript
const text = appendSourceToRequirement(
  "系統應支援多種格式的文件上傳",
  [
    { source_id: "uuid-1", page: 3, title: "技術規格.docx" },
    { source_id: "uuid-2", page: 5, title: "需求說明書.docx" }
  ]
);
// 輸出: "系統應支援多種格式的文件上傳 (出處：技術規格.docx P.3, 需求說明書.docx P.5)。"
```

---

### `formatSingleSource()`

格式化單個出處。

**簽名**：
```typescript
function formatSingleSource(citation: Citation): string
```

**範例**：
```typescript
formatSingleSource({
  source_id: "uuid-123",
  page: 1,
  title: "3-需求說明書.docx"
});
// 輸出: "3-需求說明書.docx P.1"
```

---

### `formatMultipleSources()`

格式化多個出處，用逗號分隔。

**簽名**：
```typescript
function formatMultipleSources(citations: Citation[]): string
```

**範例**：
```typescript
formatMultipleSources([
  { source_id: "uuid-1", page: 1, title: "文檔A.docx" },
  { source_id: "uuid-2", page: 3, title: "文檔B.docx" }
]);
// 輸出: "文檔A.docx P.1, 文檔B.docx P.3"
```

---

### `extractSourceFromRequirement()`

從已格式化的文本中提取出處信息。

**簽名**：
```typescript
function extractSourceFromRequirement(text: string): {
  text: string;
  sources: string | null;
}
```

**範例**：
```typescript
const result = extractSourceFromRequirement(
  "系統需求說明 (出處：需求書.docx P.1)。"
);
// result.text: "系統需求說明"
// result.sources: "需求書.docx P.1"
```

---

### `hasSourceAnnotation()`

檢查文本是否已包含出處標註。

**簽名**：
```typescript
function hasSourceAnnotation(text: string): boolean
```

**範例**：
```typescript
hasSourceAnnotation("需求說明 (出處：文檔.docx P.1)。");  // true
hasSourceAnnotation("需求說明");  // false
```

---

### `formatRequirementsWithSources()`

批量格式化需求列表。

**簽名**：
```typescript
function formatRequirementsWithSources<T extends {
  requirement_text: string;
  citations: Citation[];
}>(requirements: T[]): Array<T & { formatted_text: string }>
```

**範例**：
```typescript
const tasks = [
  {
    id: "1",
    requirement_text: "需求1",
    citations: [{ source_id: "uuid-1", page: 1, title: "文檔.docx" }]
  },
  {
    id: "2",
    requirement_text: "需求2",
    citations: [{ source_id: "uuid-2", page: 2, title: "文檔.docx" }]
  }
];

const formatted = formatRequirementsWithSources(tasks);
// formatted[0].formatted_text: "需求1 (出處：文檔.docx P.1)。"
// formatted[1].formatted_text: "需求2 (出處：文檔.docx P.2)。"
```

---

## 🎨 格式規則

### 1. 單個出處

**格式**：`(出處：文件名 P.頁碼)。`

**範例**：
```
(出處：3-需求說明書.docx P.1)。
```

### 2. 多個出處

**格式**：`(出處：文件名A P.頁碼, 文件名B P.頁碼)。`

**範例**：
```
(出處：3-需求說明書.docx P.1, 4-技術規格.docx P.5)。
```

### 3. 無出處

如果 `citations` 為空或未定義，返回原始文本：

```typescript
appendSourceToRequirement("需求文本", []);
// 輸出: "需求文本"
```

### 4. 自動清理末尾標點

函數會自動移除原文末尾的標點符號（如 `。！？.!?`），然後統一添加 `。`：

```typescript
appendSourceToRequirement("需求說明。", citations);
// 輸出: "需求說明 (出處：...)。"  (只有一個句號)
```

---

## 💡 使用場景

### 場景 1：顯示任務需求

在 `DraggableTaskPopup` 中顯示帶出處的需求：

```tsx
<div className="requirement-spec">
  {appendSourceToRequirement(
    task.requirement_text,
    task.citations || []
  )}
</div>
```

### 場景 2：導出需求文檔

生成 Word 或 PDF 文檔時附加出處：

```typescript
const exportableRequirements = tasks.map(task => ({
  ...task,
  formatted_text: appendSourceToRequirement(
    task.requirement_text,
    task.citations
  )
}));

// 使用 formatted_text 生成文檔
```

### 場景 3：搜索和過濾

提取純文本用於搜索：

```typescript
const { text, sources } = extractSourceFromRequirement(task.formatted_text);

// 使用 text 進行全文搜索
// 使用 sources 過濾特定來源
```

### 場景 4：批量處理

格式化整個章節的需求列表：

```typescript
const chapter = {
  title: "第一章",
  requirements: [
    { requirement_text: "需求1", citations: [...] },
    { requirement_text: "需求2", citations: [...] },
  ]
};

const formattedRequirements = formatRequirementsWithSources(
  chapter.requirements
);

// 顯示或導出
```

---

## 🔧 整合到現有組件

### 已整合的組件

✅ **DraggableTaskPopup**
   - 位置：`src/components/workspace/tender-planning/components/DraggableTaskPopup.tsx`
   - 修改：在 `Requirement_Spec` 區域使用 `appendSourceToRequirement()`

### 待整合的組件

以下組件也可以整合出處顯示功能：

1. **ProposalTreeItem**
   - 顯示 Section 或 Task 時附加出處

2. **AssessmentTable**
   - 評估需求時顯示出處

3. **導出功能**
   - Word 導出
   - PDF 導出
   - Markdown 導出

---

## 📊 數據結構要求

### Citation 類型

```typescript
interface Citation {
  source_id: string;   // 來源文件 UUID
  page: number;        // 頁碼
  title?: string;      // 文件標題（必須提供以顯示出處）
  quote?: string;      // 可選的引用文字
}
```

**重要**：`title` 欄位必須提供，否則出處會顯示為 "未知來源"。

### Task 類型

```typescript
interface Task {
  id: string;
  requirement_text: string;
  citations: Citation[];  // 出處信息數組
  // ... 其他欄位
}
```

---

## ⚠️ 注意事項

### 1. 性能考量

對於大量需求的批量處理，建議使用 `useMemo` 緩存結果：

```tsx
const formattedText = useMemo(
  () => appendSourceToRequirement(task.requirement_text, task.citations),
  [task.requirement_text, task.citations]
);
```

### 2. 文本清理

函數會自動：
- 移除原文末尾的標點符號
- 統一添加中文句號 `。`
- Trim 首尾空白

如果需要保留原始格式，請複製函數並修改。

### 3. 缺失 Title

如果 `citation.title` 未定義：
```typescript
{
  source_id: "uuid-123",
  page: 1,
  // title 缺失
}
```

會顯示為：
```
(出處：未知來源 P.1)。
```

**建議**：在從數據庫查詢 citations 時，務必 JOIN sources 表獲取 title。

---

## 🧪 測試

### 單元測試範例

```typescript
import {
  appendSourceToRequirement,
  formatSingleSource,
  formatMultipleSources,
  extractSourceFromRequirement,
  hasSourceAnnotation
} from './requirementSourceFormatter';

describe('Requirement Source Formatter', () => {
  const mockCitation = {
    source_id: 'uuid-123',
    page: 1,
    title: '測試文檔.docx',
    quote: '這是引用'
  };

  it('should format single source correctly', () => {
    const result = formatSingleSource(mockCitation);
    expect(result).toBe('測試文檔.docx P.1');
  });

  it('should append source to requirement text', () => {
    const text = '這是一個需求';
    const result = appendSourceToRequirement(text, [mockCitation]);
    expect(result).toBe('這是一個需求 (出處：測試文檔.docx P.1)。');
  });

  it('should handle multiple sources', () => {
    const citations = [
      { ...mockCitation, page: 1, title: '文檔A.docx' },
      { ...mockCitation, page: 3, title: '文檔B.docx' }
    ];
    const result = appendSourceToRequirement('需求', citations);
    expect(result).toContain('文檔A.docx P.1, 文檔B.docx P.3');
  });

  it('should extract source from formatted text', () => {
    const text = '需求說明 (出處：文檔.docx P.1)。';
    const result = extractSourceFromRequirement(text);
    expect(result.text).toBe('需求說明');
    expect(result.sources).toBe('文檔.docx P.1');
  });

  it('should detect source annotation', () => {
    expect(hasSourceAnnotation('需求 (出處：文檔.docx P.1)。')).toBe(true);
    expect(hasSourceAnnotation('需求')).toBe(false);
  });
});
```

---

## 📝 更新日誌

### v1.0.0 (2026-01-26)

- ✨ 初始版本
- ✅ 實現基本的出處格式化功能
- ✅ 支援單個和多個出處
- ✅ 整合到 DraggableTaskPopup 組件
- ✅ 完整的 TypeScript 類型定義
- ✅ 完整的使用文檔

---

## 🤝 貢獻

如需修改或擴展功能，請遵循以下原則：

1. **保持格式一致性**：出處格式 `(出處：文件名 P.頁碼)。` 不應變更
2. **類型安全**：所有函數都應有完整的 TypeScript 類型定義
3. **單元測試**：添加新功能時應補充相應的測試
4. **文檔更新**：修改 API 時同步更新本文檔

---

## 📞 支援

如有問題或建議，請：
1. 查看本文檔的 FAQ 部分
2. 檢查 TypeScript 類型定義
3. 查看單元測試範例
4. 聯繫開發團隊

---

**最後更新**：2026-01-26
**版本**：1.0.0
**維護者**：Frontend Team
