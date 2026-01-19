# ProposalStructureEditor 重构 - 问题跟踪清单

**QA 测试专家**: Sam
**日期**: 2026-01-17
**项目**: ProposalStructureEditor 重构
**阶段**: Phase 1
**状态**: 17 个问题待解决

---

## 🔴 P0 - 关键问题 (8 个)

这些问题必须在进入生产环境前解决。

---

### P0-001: useSectionState.fetchData 未实现

**文件**: `hooks/useSectionState.ts`
**行号**: 36-38

**当前代码**:
```typescript
const fetchData = useCallback(async () => {
  // TODO: Implement fetchData logic from original component
}, [projectId]);
```

**问题**: 核心数据加载功能缺失

**影响**:
- 无法加载章节数据
- 组件无法正常工作
- 阻塞所有依赖功能

**修复建议**:
从原始组件 (ProposalStructureEditor.tsx 第 158-292 行) 迁移以下逻辑:
1. 查询 sections 表 (包含 tasks)
2. 递归加载子章节
3. 构建树形结构
4. 加载 project_sources 数据
5. 设置 sections, sources, linkedSourceIds 状态

**估计工作量**: 2-3 小时

**优先级**: 🔴 P0 (最高)

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-002: 主组件不存在

**文件**: `proposal-editor/ProposalStructureEditor.tsx`

**问题**: 主组件文件不存在

**影响**:
- 无法导入和使用组件
- 无法进行集成测试
- 无法验证向后兼容性

**修复建议**:
创建主组件文件,集成所有 hooks 和子组件:

```typescript
// proposal-editor/ProposalStructureEditor.tsx
export function ProposalStructureEditor({ projectId }: Props) {
  // 1. 使用所有 hooks
  const sectionState = useSectionState(projectId);
  const dialogState = useDialogState();
  const dragDrop = useDragDrop(projectId, sectionState);
  // ... 其他 hooks

  // 2. 使用 useEffect 初始化
  useEffect(() => {
    sectionState.fetchData();
  }, []);

  // 3. 渲染组件树
  return (
    <DndContext sensors={dragDrop.sensors} onDragEnd={dragDrop.handleDragEnd}>
      <ProposalHeader ... />
      <ProposalTree ... />
      <ProposalDialogs ... />
      <FloatingContentPanels ... />
    </DndContext>
  );
}
```

**估计工作量**: 3-4 小时

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-003: useSectionOperations CRUD 未实现

**文件**: `hooks/useSectionOperations.ts`
**行号**: 24-48

**问题**: 所有 CRUD 操作未实现

**当前代码**:
```typescript
const handleAddSection = useCallback(async (title: string, parentId?: string) => {
  // 待实现
  console.log('handleAddSection not yet implemented');
}, [projectId, sectionState, supabase]);
```

**影响**:
- 无法添加章节
- 无法更新章节
- 无法删除章节
- 核心功能缺失

**修复建议**:
从原始组件迁移以下逻辑:
1. handleAddSection (第 294-350 行)
2. handleUpdateSection (第 352-410 行)
3. handleDeleteSection (第 412-470 行)

**估计工作量**: 3-4 小时

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-004: useTaskOperations CRUD 未实现

**文件**: `hooks/useTaskOperations.ts`
**行号**: 24-48

**问题**: 所有任务 CRUD 操作未实现

**影响**:
- 无法添加任务
- 无法更新任务
- 无法删除任务
- 核心功能缺失

**修复建议**:
从原始组件迁移以下逻辑:
1. handleAddTask (第 570-640 行)
2. handleUpdateTask (第 642-700 行)
3. handleDeleteTask (第 702-760 行)

**估计工作量**: 3-4 小时

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-005: UseSectionOperationsReturn 类型缺失

**文件**: `hooks/useSectionOperations.ts`

**问题**: 没有定义返回类型接口

**影响**:
- 类型检查不完整
- hooks/index.ts 导出失败
- TypeScript 编译错误

**修复建议**:
添加接口定义:

```typescript
export interface UseSectionOperationsReturn {
  handleAddSection: (title: string, parentId?: string) => Promise<void>;
  handleUpdateSection: (
    sectionId: string,
    updates: Partial<Section>
  ) => Promise<void>;
  handleDeleteSection: (sectionId: string) => Promise<void>;
}

export function useSectionOperations(
  projectId: string,
  sectionState: UseSectionStateReturn,
  dialogState: UseDialogStateReturn
): UseSectionOperationsReturn {
  // ...
}
```

**估计工作量**: 15 分钟

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-006: UseTaskOperationsReturn 类型缺失

**文件**: `hooks/useTaskOperations.ts`

**问题**: 没有定义返回类型接口

**修复建议**:
```typescript
export interface UseTaskOperationsReturn {
  handleAddTask: (sectionId: string, requirementText: string) => Promise<void>;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
}
```

**估计工作量**: 15 分钟

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-007: UseContentGenerationReturn 类型缺失

**文件**: `hooks/useContentGeneration.ts`

**问题**: 没有定义返回类型接口

**修复建议**:
```typescript
export interface UseContentGenerationReturn {
  handleGenerateTaskContent: (
    taskId: string,
    sourceIds: string[]
  ) => Promise<void>;
  handleGenerateSectionContent: (
    sectionId: string,
    sourceIds: string[]
  ) => Promise<void>;
  handleIntegrateContent: (sectionId: string) => Promise<void>;
}
```

**估计工作量**: 15 分钟

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P0-008: hooks/index.ts 导出不存在的类型

**文件**: `hooks/index.ts`
**行号**: 19-31

**问题**: 导出了尚未定义的类型

**当前代码**:
```typescript
export type { UseSectionOperationsReturn } from './useSectionOperations';
export type { UseTaskOperationsReturn } from './useTaskOperations';
export type { UseContentGenerationReturn } from './useContentGeneration';
export type { UseImageGenerationReturn } from './useImageGeneration';
export type { UseTaskContentsReturn } from './useTaskContents';
```

**影响**: TypeScript 编译失败

**修复建议**:
临时注释掉不存在的类型导出:

```typescript
export { useSectionOperations } from './useSectionOperations';
// export type { UseSectionOperationsReturn } from './useSectionOperations'; // TODO: Add type

export { useTaskOperations } from './useTaskOperations';
// export type { UseTaskOperationsReturn } from './useTaskOperations'; // TODO: Add type

// ... 其他类似
```

**估计工作量**: 10 分钟

**优先级**: 🔴 P0

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

## 🟡 P1 - 高优先级问题 (9 个)

这些问题影响重要功能,应在第 2 阶段解决。

---

### P1-001: useSectionState.fetchTaskContents 未实现

**文件**: `hooks/useSectionState.ts`
**行号**: 40-42

**问题**: 任务内容加载功能未实现

**影响**: 无法显示任务内容

**估计工作量**: 1-2 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-002: useDragDrop.handleDragEnd 未实现

**文件**: `hooks/useDragDrop.ts`
**行号**: 27-32

**问题**: 拖拽结束处理逻辑未实现

**影响**: 拖拽功能不工作

**迁移来源**: 原始组件第 1825-1998 行

**估计工作量**: 3-4 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-003: useRealtimeUpdates 订阅未实现

**文件**: `hooks/useRealtimeUpdates.ts`
**行号**: 14-24

**问题**: Supabase 实时订阅未实现

**影响**: 无法实时更新数据

**迁移来源**: 原始组件第 79-132 行

**估计工作量**: 2 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-004: UseImageGenerationReturn 类型缺失

**文件**: `hooks/useImageGeneration.ts`

**问题**: 返回类型未定义

**修复建议**:
```typescript
export interface UseImageGenerationReturn {
  handleGenerateTaskImage: (
    taskId: string,
    options: ImageGenerationOptions
  ) => Promise<void>;
  handleDeleteImage: (taskId: string, imageUrl: string) => Promise<void>;
}
```

**估计工作量**: 15 分钟

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-005: UseTaskContentsReturn 类型缺失

**文件**: `hooks/useTaskContents.ts`

**问题**: 返回类型未定义

**修复建议**:
```typescript
export interface UseTaskContentsReturn {
  fetchTaskContents: (taskIds: string[]) => Promise<void>;
  openContentPanel: (
    taskId: string,
    taskText: string,
    sectionTitle: string
  ) => void;
  closeContentPanel: (taskId: string) => void;
  openContentPanels: Map<string, { taskText: string; sectionTitle: string }>;
}
```

**估计工作量**: 15 分钟

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-006: useContentGeneration 功能未实现

**文件**: `hooks/useContentGeneration.ts`

**问题**: 所有内容生成功能未实现

**影响**: 无法生成 AI 内容

**迁移来源**: 原始组件第 870-1020 行

**估计工作量**: 4-5 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-007: useImageGeneration 功能未实现

**文件**: `hooks/useImageGeneration.ts`

**问题**: 图片生成功能未实现

**影响**: 无法生成图片

**迁移来源**: 原始组件相关逻辑

**估计工作量**: 3-4 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-008: useTaskContents 功能未实现

**文件**: `hooks/useTaskContents.ts`

**问题**: 任务内容管理功能未实现

**影响**: 无法管理和显示任务内容

**估计工作量**: 2-3 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

### P1-009: ProposalTree 组件未实现

**文件**: `components/ProposalTree.tsx`

**问题**: 树形结构渲染组件未实现

**影响**: 无法显示章节树

**估计工作量**: 3-4 小时

**优先级**: 🟡 P1

**负责人**: [ ] 待分配

**状态**: ❌ 未开始

---

## 🟢 P2 - 中优先级问题 (无)

暂无 P2 问题。

---

## 📝 问题统计

### 按优先级

| 优先级 | 数量 | 百分比 |
|--------|------|--------|
| P0 (关键) | 8 | 47% |
| P1 (高) | 9 | 53% |
| P2 (中) | 0 | 0% |
| **总计** | **17** | **100%** |

---

### 按类型

| 类型 | 数量 | 百分比 |
|------|------|--------|
| 功能未实现 | 10 | 59% |
| 类型缺失 | 5 | 29% |
| 组件缺失 | 2 | 12% |
| **总计** | **17** | **100%** |

---

### 按文件

| 文件 | 问题数 | 优先级 |
|------|--------|--------|
| useSectionOperations.ts | 2 | P0 |
| useTaskOperations.ts | 2 | P0 |
| useSectionState.ts | 2 | P0, P1 |
| useContentGeneration.ts | 2 | P0, P1 |
| hooks/index.ts | 1 | P0 |
| useDragDrop.ts | 1 | P1 |
| useRealtimeUpdates.ts | 1 | P1 |
| useImageGeneration.ts | 2 | P1 |
| useTaskContents.ts | 2 | P1 |
| ProposalTree.tsx | 1 | P1 |
| ProposalStructureEditor.tsx | 1 | P0 |

---

### 按状态

| 状态 | 数量 | 百分比 |
|------|------|--------|
| ❌ 未开始 | 17 | 100% |
| 🔨 进行中 | 0 | 0% |
| ✅ 已完成 | 0 | 0% |

---

## 🎯 解决路线图

### 阶段 1: 类型修复 (0.5 天)

**目标**: 解决所有类型相关问题

**任务**:
- [ ] P0-005: UseSectionOperationsReturn
- [ ] P0-006: UseTaskOperationsReturn
- [ ] P0-007: UseContentGenerationReturn
- [ ] P1-004: UseImageGenerationReturn
- [ ] P1-005: UseTaskContentsReturn
- [ ] P0-008: hooks/index.ts 导出

**预计时间**: 2 小时

---

### 阶段 2: 核心功能 (2 天)

**目标**: 实现基本可用的组件

**任务**:
- [ ] P0-001: useSectionState.fetchData
- [ ] P0-003: useSectionOperations CRUD
- [ ] P0-004: useTaskOperations CRUD
- [ ] P0-002: 主组件集成

**预计时间**: 12-16 小时

---

### 阶段 3: 辅助功能 (1.5 天)

**目标**: 实现拖拽和实时更新

**任务**:
- [ ] P1-002: useDragDrop.handleDragEnd
- [ ] P1-003: useRealtimeUpdates 订阅
- [ ] P1-001: fetchTaskContents
- [ ] P1-009: ProposalTree 组件

**预计时间**: 10-12 小时

---

### 阶段 4: 生成功能 (1 天)

**目标**: 实现 AI 生成功能

**任务**:
- [ ] P1-006: useContentGeneration 功能
- [ ] P1-007: useImageGeneration 功能
- [ ] P1-008: useTaskContents 功能

**预计时间**: 8-10 小时

---

**总预计时间**: 5 天

---

## 📊 每日跟踪

### 2026-01-18 (Day 1)

**计划**:
- [ ] 修复所有类型问题 (阶段 1)
- [ ] 开始核心功能实现 (阶段 2)

**完成**: 0/17

**阻塞**: 无

**备注**:

---

### 2026-01-19 (Day 2)

**计划**:
- [ ] 继续核心功能实现

**完成**: /17

**阻塞**:

**备注**:

---

### 2026-01-20 (Day 3)

**计划**:
- [ ] 完成核心功能
- [ ] 开始辅助功能

**完成**: /17

**阻塞**:

**备注**:

---

### 2026-01-21 (Day 4)

**计划**:
- [ ] 完成辅助功能
- [ ] 开始生成功能

**完成**: /17

**阻塞**:

**备注**:

---

### 2026-01-22 (Day 5)

**计划**:
- [ ] 完成生成功能
- [ ] 集成测试

**完成**: /17

**阻塞**:

**备注**:

---

## 🔗 相关资源

### 原始组件参考

- **文件**: `/frontend/src/components/workspace/ProposalStructureEditor.tsx`
- **行数**: 2201
- **关键逻辑位置**:
  - 数据加载: L158-292
  - 实时订阅: L79-132
  - 拖拽逻辑: L1825-1998
  - 章节 CRUD: L294-560
  - 任务 CRUD: L570-850
  - 内容生成: L870-1020

### 新模块文档

- **架构文档**: `/frontend/src/components/workspace/proposal-editor/README.md`
- **完成报告**: `/frontend/src/components/workspace/proposal-editor/COMPLETION_REPORT.md`

### 验收报告

- **功能验证**: `PHASE_1_FUNCTIONAL_VALIDATION_REPORT.md`
- **类型安全**: `PHASE_1_TYPE_SAFETY_REPORT.md`
- **兼容性**: `PHASE_1_COMPATIBILITY_CHECK.md`
- **验收清单**: `PHASE_1_ACCEPTANCE_CHECKLIST.md`
- **执行摘要**: `PHASE_1_EXECUTIVE_SUMMARY.md`

---

## 📞 报告问题

如发现新问题,请按以下格式添加:

```markdown
### P?-XXX: 问题标题

**文件**: `路径/文件名`
**行号**: XX-YY

**问题**: 简短描述

**影响**: 对系统的影响

**修复建议**: 如何修复

**估计工作量**: X 小时

**优先级**: 🔴 P0 / 🟡 P1 / 🟢 P2

**负责人**: [ ] 待分配

**状态**: ❌ 未开始 / 🔨 进行中 / ✅ 已完成
```

---

**更新日期**: 2026-01-17
**维护人**: Sam (QA Tester)
**版本**: 1.0
