# 🚀 Phase 4 快速开始指南

**目标**: 快速理解和开始 Phase 4 工作
**读取时间**: 5-10 分钟
**开始工作**: 15-30 分钟

---

## 📍 当前状态

✅ **Phase 3 完成**: 18/18 Dialog 已迁移
⏳ **Phase 4 准备**: 计划完成，可立即开始实施

---

## 🎯 Phase 4 三个核心任务

### Task 1: 状态管理优化 (4.1)
**工作量**: 4-6 小时
**关键文件**: `ProposalStructureEditor.tsx` (2198 行)
**目标**: 从 51 个 useState → 1 个 useProposalState hook

```typescript
// 步骤 1: 导入 hook
import { useProposalState } from './hooks/useProposalState';

// 步骤 2: 替换所有 useState
const state = useProposalState(projectId);

// 步骤 3: 访问状态
// 之前: sections, setSections, setLoading, ...
// 之后: state.sections, state.setLoading, state.loading, ...

// 步骤 4: 测试功能
// 运行应用，确保所有功能正常
```

**预期成果**: 代码行数减少 200-300 行，复杂度下降

---

### Task 2: 组件拆分 (4.2 & 4.3)
**工作量**: 12-16 小时
**关键文件**: `ProposalStructureEditor.tsx`, `SourceManager.tsx`
**目标**: 拆分为 13 个小组件

**拆分顺序** (优先级):
1. **SectionListPanel** (200 行) - 部分列表
2. **TaskListPanel** (250 行) - 任务列表
3. **SourceList** (280 行) - 虚拟化列表
4. **ContentPanel** (200 行) - 内容编辑
5. **AIGenerationControls** (150 行) - AI 按钮
6. **SourceFilters** (150 行) - 过滤控件
7. **其他 7 个组件** (140-180 行 每个)

---

### Task 3: 清理和优化 (4.4)
**工作量**: 5-7 小时
**关键文件**: 所有工作区组件
**目标**: 清理 console，添加 Immer

```typescript
// Console 清理: 使用 logger 替代
import { logger } from '@/lib/logger';
logger.error('error message');  // 替代 console.error
logger.debug('debug message');  // 替代 console.log

// Immer 优化: 简化状态更新
import { useImmer } from 'use-immer';
const [state, setState] = useImmer(initialState);
// 直接修改状态，Immer 自动处理不可变性
```

---

## 📋 检查清单

### 开始前
- [ ] 运行 `npm install` 确保依赖完整
- [ ] 运行 `tsc --noEmit` 验证类型
- [ ] 读取 `PHASE_4_IMPLEMENTATION_PLAN.md`
- [ ] 了解现有的 useProposalState 结构

### 进行中
- [ ] 每个改动后运行测试
- [ ] 定期 commit 保存进度
- [ ] 保持 TypeScript 类型检查通过
- [ ] 验证功能没有破坏

### 完成后
- [ ] 运行完整测试套件
- [ ] 代码审查
- [ ] 性能验证
- [ ] 更新文档

---

## 🔧 关键文件和位置

### Hooks (已存在，可直接使用)
```
src/components/workspace/proposal-editor/hooks/
├── useProposalState.ts          ← 状态管理 (51 个 useState)
├── useProposalOperations.ts     ← 业务逻辑 (所有操作)
└── useProposalDialogs.ts        ← 对话框管理
```

### Query Hooks (已存在)
```
src/hooks/queries/
├── useSourcesQuery.ts           ← 源数据缓存
├── useTemplatesQuery.ts         ← 模板缓存
└── useProjectsQuery.ts          ← 项目缓存
```

### 通用组件 (已存在)
```
src/components/common/
├── dialogs/BaseDialog.tsx       ← 统一 Dialog 框架
├── lists/VirtualizedList.tsx    ← 虚拟化列表
└── ...其他通用组件
```

### 待创建的新组件
```
src/components/workspace/proposal-editor/panels/
├── SectionListPanel.tsx         ← 待创建
├── TaskListPanel.tsx            ← 待创建
├── ContentPanel.tsx             ← 待创建
└── ...等其他

src/components/workspace/source-manager/
├── SourceList.tsx               ← 待创建
├── SourceFilters.tsx            ← 待创建
└── SourceDetails.tsx            ← 待创建
```

---

## 💡 实施建议

### 建议工作流
```
1. 阅读理解
   ├── 读取 PHASE_4_IMPLEMENTATION_PLAN.md (了解全局)
   └── 读取本文档 (了解快速开始)

2. 环境准备
   ├── npm install
   ├── tsc --noEmit (验证类型)
   └── npm run dev (启动开发服务)

3. 开始 Task 4.1 (状态管理)
   ├── 打开 ProposalStructureEditor.tsx
   ├── 导入 useProposalState
   ├── 替换 useState 为 state.* 访问
   ├── 测试功能
   └── Commit 保存进度

4. 继续 Task 4.1.2 (操作函数)
   ├── 导入 useProposalOperations
   ├── 替换所有 handleXxx 函数为 ops.xxx
   ├── 测试所有操作
   └── Commit 保存进度

5. 开始 Task 4.2 (组件拆分)
   ├── 按优先级拆分每个组件
   ├── 每个组件单独 commit
   ├── 运行测试确保功能
   └── 整合回主组件
```

### 拆分组件的标准模板
```typescript
// src/components/workspace/proposal-editor/panels/SectionListPanel.tsx

"use client";

import { Section, Task } from "../types";

interface SectionListPanelProps {
  sections: Section[];
  expandedSections: Set<string>;
  onToggleExpand: (sectionId: string) => void;
  onAddSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
}

export function SectionListPanel({
  sections,
  expandedSections,
  onToggleExpand,
  onAddSection,
  onEditSection,
  onDeleteSection,
}: SectionListPanelProps) {
  // 从 ProposalStructureEditor 提取的逻辑
  // 保持原有功能不变

  return (
    <div className="section-list">
      {/* 渲染逻辑 */}
    </div>
  );
}
```

---

## 🧪 测试策略

### 单位测试
```typescript
// 测试拆分的组件
describe('SectionListPanel', () => {
  it('should render sections', () => { ... });
  it('should handle expand/collapse', () => { ... });
  it('should call onAddSection when add button clicked', () => { ... });
});
```

### 集成测试
```typescript
// 测试整个工作流
describe('ProposalStructureEditor Integration', () => {
  it('should create section and display in list', async () => { ... });
  it('should add task to section', async () => { ... });
});
```

### 手动测试检查表
```
[ ] Dialog 打开/关闭
[ ] 表单提交成功
[ ] 错误处理正确
[ ] 列表更新实时
[ ] 无控制台错误
[ ] 性能没有下降
[ ] 响应式设计工作
[ ] 无障碍功能完整
```

---

## 🎯 按优先级的工作顺序

### Week 1 优先级
```
1. 🔴 高 → Task 4.1.1 (集成 useProposalState)
2. 🔴 高 → Task 4.1.2 (集成 useProposalOperations)
3. 🟠 中 → Task 4.1.3 (集成 Query Hooks)
4. 🟠 中 → Task 4.2.1 (提取 SectionListPanel)
```

### Week 2 优先级
```
1. 🟠 中 → Task 4.2.2-5 (提取更多组件)
2. 🟠 中 → Task 4.3.1 (提取 SourceList)
3. 🟡 低 → Task 4.3.2-3 (其他 SourceManager 组件)
```

### Week 3 优先级
```
1. 🟠 中 → Task 4.4.1 (清理 console)
2. 🟠 中 → Task 4.4.2 (添加 Immer)
3. 🟠 中 → 全面测试和优化
```

---

## 💻 Git 工作流建议

```bash
# 创建 feature 分支
git checkout -b feature/phase-4-optimization

# Task 4.1.1 完成后
git add .
git commit -m "feat: integrate useProposalState hook

- Replace 51 useState declarations with useProposalState
- Improve state management clarity
- Reduce component complexity"

# Task 4.1.2 完成后
git commit -m "feat: integrate useProposalOperations hook

- Centralize all business logic operations
- Improve code reusability
- Simplify component methods"

# 每个组件拆分后都 commit
git commit -m "refactor: extract SectionListPanel component

- Split 200 lines from ProposalStructureEditor
- Improve component reusability
- Reduce main component size"

# 完成 Phase 4 后
git push origin feature/phase-4-optimization
# 创建 Pull Request 进行代码审查
```

---

## 📞 常见问题和答案

### Q: 如何理解 useProposalState 结构？
**A**: 查看 `src/components/workspace/proposal-editor/hooks/useProposalState.ts`
- 它聚合了所有的 state 管理
- 提供统一的 state 访问接口
- 返回对象包含: sections, tasks, dialogs, loading 等

### Q: 如何替换 useState？
**A**:
```typescript
// 之前
const [sections, setSections] = useState<Section[]>([]);

// 之后
const state = useProposalState(projectId);
// 访问: state.sections
// 更新: state.setSections(...)
```

### Q: 组件拆分后如何集成？
**A**: 通过 props 传递数据和回调函数
```typescript
<SectionListPanel
  sections={state.sections}
  expandedSections={state.expandedSections}
  onAddSection={ops.addSection}
  onEditSection={ops.editSection}
  onDeleteSection={ops.deleteSection}
  onToggleExpand={toggleExpansion}
/>
```

### Q: 如何确保测试通过？
**A**:
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test SectionListPanel

# 监视模式
npm test --watch
```

### Q: 需要多长时间完成？
**A**: 根据计划:
- Task 4.1: 4-6 小时
- Task 4.2: 12-16 小时
- Task 4.3: 4-5 小时
- Task 4.4: 5-7 小时
- **总计**: 25-35 小时 (2-3 周，取决于并行度)

---

## ✅ 验收标准

Phase 4 完成时需要满足:

```
代码质量
[ ] TypeScript 严格类型检查通过
[ ] 没有 lint 错误
[ ] 没有控制台警告

功能测试
[ ] 所有 Dialog 正常工作
[ ] 所有操作成功执行
[ ] 错误处理正确
[ ] 实时更新工作

性能指标
[ ] API 请求减少 30-50%
[ ] 内存使用减少 15-20%
[ ] 首屏加载时间减少 10-15%

代码指标
[ ] 复杂度下降 70-80%
[ ] 代码行数减少 (优化框架)
[ ] 文件分布均匀 (每个 200-300 行)

测试覆盖
[ ] 单位测试覆盖 > 85%
[ ] 集成测试通过
[ ] E2E 测试通过
```

---

## 🎓 学习资源

### 官方文档
- [React Hooks 文档](https://react.dev/reference/react)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Immer 文档](https://immerjs.github.io/immer/)

### 项目文档
- `PHASE_4_IMPLEMENTATION_PLAN.md` - 详细计划
- `DIALOG_MIGRATION_GUIDE.md` - 组件模式参考
- `src/lib/a11y/aria-helpers.ts` - 无障碍模式

---

## 🚀 立即开始

```bash
# 1. 确保依赖完整
npm install

# 2. 验证类型
tsc --noEmit

# 3. 启动开发服务
npm run dev

# 4. 打开文件
# 文本编辑器打开: src/components/workspace/ProposalStructureEditor.tsx

# 5. 开始工作
# 按照本指南的步骤开始 Task 4.1
```

---

**祝工作顺利！** 🎉

有问题？参考详细计划 `PHASE_4_IMPLEMENTATION_PLAN.md` 或查看代码注释。

