# ProposalStructureEditor - 快速開始指南

## 🎯 立即使用

### 方式 1：完整組件（推薦）

```typescript
import { ProposalStructureEditor } from '@/components/workspace/proposal-editor';

function MyPage() {
  return (
    <div className="h-screen">
      <ProposalStructureEditor projectId="your-project-id" />
    </div>
  );
}
```

### 方式 2：自定義使用 Hooks

```typescript
import {
  useProposalState,
  useProposalOperations,
  useProposalDialogs,
} from '@/components/workspace/proposal-editor/hooks';

function CustomEditor({ projectId }) {
  // 1. 狀態管理
  const state = useProposalState([]);

  // 2. 數據加載
  const fetchData = async () => {
    // 你的數據加載邏輯
  };

  // 3. 操作函數
  const operations = useProposalOperations(
    projectId,
    state.sections,
    state.setSections,
    fetchData
  );

  // 4. Dialog 管理
  const dialogs = useProposalDialogs();

  // 使用操作
  const handleAddSection = async () => {
    await operations.addSection("新章節");
  };

  return (
    <div>
      <button onClick={handleAddSection}>新增章節</button>
      {/* 你的自定義 UI */}
    </div>
  );
}
```

## 📚 核心 API

### useProposalOperations

```typescript
const operations = useProposalOperations(projectId, sections, setSections, fetchData);

// 章節操作
await operations.addSection("章節標題", parentId?);
await operations.editSection(sectionId, "新標題");
await operations.deleteSection(sectionId);

// 任務操作
await operations.addTask(sectionId, "任務描述");
await operations.editTask(taskId, "新描述");
await operations.deleteTask(taskId);

// 拖拽
operations.handleDragEnd(dragEvent);

// AI 生成
await operations.generateTasks(sectionId, sourceIds, userDescription, workflowType);
await operations.generateTaskContent(taskId, sectionId, sectionTitle, taskText, sourceIds, allSections);
await operations.integrateSection(section, taskContentsMap);
await operations.generateImage(taskId, options);
```

### useProposalState

```typescript
const state = useProposalState(initialSections);

// 訪問狀態
const {
  sections,
  setSections,
  loading,
  setLoading,
  expandedSections,
  sources,
  taskContents,
  // ... 更多狀態
} = state;

// 便利函數
state.toggleSectionExpansion(sectionId);
state.toggleTaskExpansion(taskId);
state.startInlineEditSection(sectionId, currentValue);
state.cancelInlineEditSection();
```

### useProposalDialogs

```typescript
const dialogs = useProposalDialogs();

// 打開 Dialog
dialogs.openAddSection();
dialogs.openAddTask();
dialogs.openContentGeneration();

// 關閉 Dialog
dialogs.closeAddSection();
dialogs.closeAllDialogs();

// Dialog 狀態
if (dialogs.isAddSectionOpen) {
  // 渲染 Dialog
}
```

## 🔧 常見使用場景

### 場景 1：新增章節並添加任務

```typescript
async function createChapterWithTasks(projectId: string) {
  const operations = useProposalOperations(...);

  // 1. 創建章節
  await operations.addSection("第一章：背景");

  // 2. 獲取章節 ID（從 state 或 API 回應）
  const sectionId = "...";

  // 3. 添加任務
  await operations.addTask(sectionId, "任務 1：市場分析");
  await operations.addTask(sectionId, "任務 2：競品研究");
}
```

### 場景 2：使用 AI 生成任務

```typescript
async function generateTasksFromSources(sectionId: string, sourceIds: string[]) {
  const operations = useProposalOperations(...);

  await operations.generateTasks(
    sectionId,
    sourceIds,
    "請分析市場趨勢並生成相關任務",
    "technical" // 或 "management"
  );
}
```

### 場景 3：生成並整合內容

```typescript
async function generateAndIntegrateContent(section: Section) {
  const operations = useProposalOperations(...);
  const state = useProposalState([]);

  // 1. 為每個任務生成內容
  for (const task of section.tasks || []) {
    await operations.generateTaskContent(
      task.id,
      section.id,
      section.title,
      task.requirement_text,
      sourceIds,
      allSectionTitles
    );
  }

  // 2. 整合章節內容
  await operations.integrateSection(section, state.taskContents);
}
```

### 場景 4：拖拽排序

```typescript
import { DndContext } from '@dnd-kit/core';

function MyTree() {
  const operations = useProposalOperations(...);

  return (
    <DndContext onDragEnd={operations.handleDragEnd}>
      {/* 你的可拖拽項目 */}
    </DndContext>
  );
}
```

## 🎨 自定義 UI

### 自定義樹形渲染

```typescript
import { ProposalTree } from '@/components/workspace/proposal-editor/components';

function CustomTree() {
  const customRenderSection = (section, depth, dragHandleProps) => {
    return (
      <div style={{ paddingLeft: `${depth * 20}px` }}>
        <div {...dragHandleProps}>📄 {section.title}</div>
        {/* 自定義渲染邏輯 */}
      </div>
    );
  };

  return (
    <ProposalTree
      sections={sections}
      loading={loading}
      expandedSections={expandedSections}
      renderSection={customRenderSection}
      onToggleExpand={toggleExpand}
      onDragEnd={handleDragEnd}
    />
  );
}
```

## 🐛 故障排除

### 問題：操作後數據未更新

**解決方案**：確保調用 `fetchData()` 刷新數據

```typescript
await operations.addSection("新章節");
await fetchData(); // 手動刷新
```

### 問題：拖拽不生效

**解決方案**：確保使用 DndContext 和正確的 sensors

```typescript
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor)
);

<DndContext sensors={sensors} onDragEnd={operations.handleDragEnd}>
  {/* 內容 */}
</DndContext>
```

### 問題：TypeScript 類型錯誤

**解決方案**：導入正確的類型

```typescript
import type { Section, Task, Source } from '@/components/workspace/proposal-editor/types';
```

## 📖 進階主題

### 實時訂閱（TODO）

```typescript
import { useRealtimeUpdates } from '@/components/workspace/proposal-editor/hooks';

function RealtimeEditor({ projectId }) {
  useRealtimeUpdates(projectId, fetchData);
  // 自動訂閱數據變更
}
```

### 性能優化

```typescript
import { useMemo, useCallback } from 'react';

function OptimizedEditor() {
  // 1. 使用 useMemo 緩存計算結果
  const flatSections = useMemo(() => {
    return flattenSections(sections);
  }, [sections]);

  // 2. 使用 useCallback 緩存回調
  const handleClick = useCallback(() => {
    operations.addSection("新章節");
  }, [operations]);
}
```

## 🔗 相關文檔

- [完整實現狀態](./IMPLEMENTATION_STATUS.md) - 查看已完成和待實現的功能
- [架構文檔](./README.md) - 詳細的架構說明
- [類型定義](./types.ts) - 所有 TypeScript 類型

## 💡 最佳實踐

1. **使用統一的數據加載函數**
   ```typescript
   const fetchData = useCallback(async () => {
     // 統一的數據加載邏輯
   }, [projectId]);
   ```

2. **錯誤處理**
   ```typescript
   try {
     await operations.addSection("新章節");
   } catch (error) {
     console.error("操作失敗:", error);
     // 顯示錯誤提示
   }
   ```

3. **樂觀更新**
   ```typescript
   // operations 已包含樂觀更新邏輯
   await operations.deleteTask(taskId); // 立即更新 UI，後台同步
   ```

4. **類型安全**
   ```typescript
   import type { Section, Task } from '@/components/workspace/proposal-editor/types';

   function processSection(section: Section) {
     // TypeScript 會檢查類型
   }
   ```

---

**需要幫助？** 查看 [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) 了解當前實現狀態。
