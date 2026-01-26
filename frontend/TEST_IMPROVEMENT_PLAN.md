# ProposalStructureEditor 測試改進計畫

**QA 審查官**: Sam
**日期**: 2026-01-26
**目標**: 將 proposal-editor 模塊測試覆蓋率提升至 70%+

---

## 📊 當前狀態

### 已完成 ✅
- `useProposalState.ts` - 100% 覆蓋率 (34 測試)
- `treeTraversal.ts` - 100% 覆蓋率 (33 測試)
- `sectionUtils.ts` - 87.5% 覆蓋率 (24 測試，3 失敗)

### 未開始 ❌
- `useProposalOperations.ts` - 0% 覆蓋率
- `useProposalDialogs.ts` - 0% 覆蓋率
- 其他 Hooks (useDragDrop, useTaskOperations, etc.)
- 所有組件 (ProposalTree, ProposalHeader, etc.)

---

## 🎯 修復 sectionUtils 失敗測試

### 問題分析
Jest module mock 無法攔截同一模塊內的函數調用。當 `autoSortChildren` 內部調用 `updateOrder` 時，mock 不會生效。

### 解決方案 1: 依賴注入重構 (推薦)

**重構 sectionUtils.ts**:
```typescript
// 將 updateOrder 作為可選參數
export async function autoSortChildren(
  supabase: SupabaseClient,
  projectId: string,
  parentId: string,
  updateOrderFn: typeof updateOrder = updateOrder // 預設值為實際函數
): Promise<void> {
  try {
    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('parent_id', parentId);

    if (!data || data.length === 0) return;

    // ... 排序邏輯 ...

    if (!needsUpdate) return;

    // 使用注入的函數
    await updateOrderFn(supabase, updates);
  } catch (e) {
    // Auto-sort failure is non-critical
  }
}
```

**更新測試**:
```typescript
it('should sort children by Chinese numerals', async () => {
  const mockUpdateOrder = jest.fn().mockResolvedValue(undefined);
  const mockData = [
    { id: 's1', title: '三、第三章', parent_id: 'parent', order_index: 3 },
    { id: 's2', title: '一、第一章', parent_id: 'parent', order_index: 1 },
    { id: 's3', title: '二、第二章', parent_id: 'parent', order_index: 2 },
  ];

  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
  };

  const mockSupabase = {
    from: jest.fn(() => mockChain),
  };

  // 直接注入 mock
  await autoSortChildren(mockSupabase, 'project-1', 'parent', mockUpdateOrder);

  expect(mockUpdateOrder).toHaveBeenCalled();
  const updateCall = mockUpdateOrder.mock.calls[0][1];
  expect(updateCall[0].id).toBe('s2'); // 一
  expect(updateCall[1].id).toBe('s3'); // 二
  expect(updateCall[2].id).toBe('s1'); // 三
});
```

### 解決方案 2: 集成測試策略

**直接 Mock Supabase upsert**:
```typescript
it('should sort children by Chinese numerals (integration)', async () => {
  const mockData = [
    { id: 's1', title: '三、第三章', parent_id: 'parent', order_index: 3 },
    { id: 's2', title: '一、第一章', parent_id: 'parent', order_index: 1 },
    { id: 's3', title: '二、第二章', parent_id: 'parent', order_index: 2 },
  ];

  const mockUpsert = jest.fn().mockResolvedValue({ error: null });
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
  };

  const mockSupabase = {
    from: jest.fn((table) => {
      if (table === 'sections' && !mockChain.select.mock.calls.length) {
        return mockChain;
      }
      return {
        upsert: mockUpsert,
      };
    }),
  };

  await autoSortChildren(mockSupabase, 'project-1', 'parent');

  expect(mockUpsert).toHaveBeenCalled();
  const upsertCall = mockUpsert.mock.calls[0][0];
  expect(upsertCall[0].id).toBe('s2'); // 一
  expect(upsertCall[1].id).toBe('s3'); // 二
  expect(upsertCall[2].id).toBe('s1'); // 三
});
```

### 建議
採用**解決方案 1 (依賴注入)**，因為：
- ✅ 更符合測試最佳實踐
- ✅ 提升代碼可測試性
- ✅ 保持單元測試的純粹性
- ✅ 未來可擴展性更好

---

## 🧪 useProposalOperations 測試計畫

### 測試文件
`/src/__tests__/components/workspace/proposal-editor/hooks/useProposalOperations.test.ts`

### 測試策略

#### 1. Mock Supabase Client
```typescript
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ error: null }),
  update: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockResolvedValue({ error: null }),
  eq: jest.fn().mockResolvedValue({ error: null }),
};
```

#### 2. Mock fetchData 回調
```typescript
const mockFetchData = jest.fn().mockResolvedValue(undefined);
```

#### 3. Mock toast
```typescript
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));
```

### 測試用例設計

#### A. Section 操作 (15 測試)
```typescript
describe('Section Operations', () => {
  it('should add section without parent');
  it('should add section with parent');
  it('should handle add section database error');
  it('should edit section title');
  it('should handle edit section database error');
  it('should delete section with confirmation');
  it('should cancel delete section');
  it('should handle delete section database error');
  it('should delete section and children recursively');
});
```

#### B. Task 操作 (12 測試)
```typescript
describe('Task Operations', () => {
  it('should add task to section');
  it('should handle add task database error');
  it('should edit task requirement_text');
  it('should handle edit task database error');
  it('should delete task with confirmation');
  it('should cancel delete task');
  it('should update local state optimistically on delete');
  it('should handle delete task database error');
});
```

#### C. 拖拽操作 (20 測試)
```typescript
describe('Drag and Drop Operations', () => {
  // Task 拖拽
  it('should handle task drag within same section');
  it('should handle task drag to different section');
  it('should calculate correct order_index after drag');
  it('should optimistically update UI before database');
  it('should rollback on database error');
  it('should handle drag to empty section');
  it('should handle drag over task');
  it('should handle drag over section');
  it('should ignore invalid drag events');

  // Section 拖拽
  it('should handle section drag (TODO)');
});
```

#### D. 生成操作 (15 測試)
```typescript
describe('Generation Operations', () => {
  // 生成任務
  it('should generate tasks with technical workflow');
  it('should generate tasks with management workflow');
  it('should handle generation with user description');
  it('should handle generation API error');

  // 生成內容
  it('should generate task content');
  it('should handle content generation error');
  it('should return word count on success');

  // 整合章節
  it('should integrate section with task contents');
  it('should handle empty section integration');
  it('should handle missing task contents');
  it('should save integrated content to database');
  it('should handle integration API error');

  // 生成圖片
  it('should generate image for task');
  it('should handle image generation error');
  it('should refresh data after image generation');
});
```

### 測試模板

```typescript
/**
 * useProposalOperations Hook Test Suite
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProposalOperations } from '@/components/workspace/proposal-editor/hooks/useProposalOperations';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useProposalOperations', () => {
  let mockSupabase: any;
  let mockFetchData: jest.Mock;
  let mockSections: Section[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockFetchData = jest.fn().mockResolvedValue(undefined);

    mockSections = [
      {
        id: 'section-1',
        title: 'Section 1',
        order_index: 1,
        tasks: [],
      },
    ];
  });

  // ============ Section Operations Tests ============

  describe('addSection', () => {
    it('should add section without parent', async () => {
      const { result } = renderHook(() =>
        useProposalOperations('project-1', mockSections, jest.fn(), mockFetchData)
      );

      await act(async () => {
        await result.current.addSection('New Section');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('sections');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        project_id: 'project-1',
        title: 'New Section',
        parent_id: null,
        order_index: 0,
      });
      expect(toast.success).toHaveBeenCalledWith('章節已添加');
      expect(mockFetchData).toHaveBeenCalled();
    });

    // ... 其他測試
  });

  // ============ Task Operations Tests ============

  describe('addTask', () => {
    it('should add task to section', async () => {
      const { result } = renderHook(() =>
        useProposalOperations('project-1', mockSections, jest.fn(), mockFetchData)
      );

      await act(async () => {
        await result.current.addTask('section-1', 'New Task');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        project_id: 'project-1',
        section_id: 'section-1',
        requirement_text: 'New Task',
        status: 'pending',
      });
      expect(toast.success).toHaveBeenCalledWith('任務已添加');
      expect(mockFetchData).toHaveBeenCalled();
    });

    // ... 其他測試
  });

  // ============ Drag and Drop Tests ============

  describe('handleDragEnd', () => {
    it('should handle task drag within same section', async () => {
      // ... 實現
    });

    // ... 其他測試
  });

  // ============ Generation Operations Tests ============

  describe('generateTasks', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      (global.fetch as jest.Mock).mockRestore();
    });

    it('should generate tasks with technical workflow', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ taskCount: 5 }),
      });

      const { result } = renderHook(() =>
        useProposalOperations('project-1', mockSections, jest.fn(), mockFetchData)
      );

      await act(async () => {
        await result.current.generateTasks('section-1', ['source-1'], 'description', 'technical');
      });

      expect(fetch).toHaveBeenCalledWith('/api/webhook/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'project-1',
          sectionId: 'section-1',
          sourceIds: ['source-1'],
          userDescription: 'description',
          workflowType: 'technical',
        }),
      });

      expect(toast.success).toHaveBeenCalledWith('已生成 5 個任務');
      expect(mockFetchData).toHaveBeenCalled();
    });

    // ... 其他測試
  });
});
```

---

## 🧩 組件測試計畫

### ProposalTree 組件測試

**文件**: `/src/__tests__/components/workspace/proposal-editor/components/ProposalTree.test.tsx`

**測試策略**:
```typescript
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ProposalTree } from '@/components/workspace/proposal-editor/components/ProposalTree';

describe('ProposalTree', () => {
  // ============ 渲染測試 ============
  it('should render empty state when no sections');
  it('should render sections');
  it('should render loading state');
  it('should render expanded sections');

  // ============ 拖拽測試 ============
  it('should enable drag and drop when sensors provided');
  it('should call onDragEnd when drag completes');

  // ============ 交互測試 ============
  it('should call onToggleExpand when clicking section');
  it('should call onAddSection when adding section');
});
```

### ProposalHeader 組件測試

**文件**: `/src/__tests__/components/workspace/proposal-editor/components/ProposalHeader.test.tsx`

**測試策略**:
```typescript
describe('ProposalHeader', () => {
  it('should render generate button');
  it('should render add section button');
  it('should disable generate button when generating');
  it('should call onGenerate when clicking generate');
  it('should call onAddSection when clicking add section');
});
```

---

## 📅 實施時間表

### Week 1: 修復與核心 Hook 測試
- **Day 1-2**: 修復 sectionUtils 失敗測試（使用依賴注入）
- **Day 3-5**: 實施 useProposalOperations 測試
  - Day 3: Section & Task Operations
  - Day 4: Drag & Drop Operations
  - Day 5: Generation Operations

**預期成果**:
- ✅ sectionUtils 100% 覆蓋率
- ✅ useProposalOperations 70%+ 覆蓋率
- 📊 整體模塊覆蓋率 → 40%+

### Week 2: Dialog Hook 與組件測試
- **Day 1**: useProposalDialogs 測試 (已有100%類型覆蓋)
- **Day 2-3**: ProposalTree 組件測試
- **Day 4**: ProposalHeader 組件測試
- **Day 5**: 其他小型 Hooks 測試 (useDragDrop, useTaskOperations)

**預期成果**:
- ✅ useProposalDialogs 90%+ 覆蓋率
- ✅ ProposalTree 80%+ 覆蓋率
- 📊 整體模塊覆蓋率 → 60%+

### Week 3: 集成測試與優化
- **Day 1-3**: 集成測試實施
  - 完整 CRUD 流程
  - 拖拽功能集成測試
- **Day 4**: 覆蓋率優化（補充遺漏測試）
- **Day 5**: 測試文檔整理與 CI 配置

**預期成果**:
- ✅ 完整集成測試套件
- ✅ CI/CD 測試流程自動化
- 📊 整體模塊覆蓋率 → **70%+** ✅

---

## 🛠️ 測試工具與最佳實踐

### 推薦測試工具
```bash
# 測試覆蓋率可視化
npm install --save-dev jest-coverage-badge-generator

# 快照測試更新工具
npm install --save-dev jest-specific-snapshot

# Mock 時間處理
npm install --save-dev @testing-library/user-event
```

### 最佳實踐

#### 1. 使用 Test Fixtures
```typescript
// test-fixtures.ts
export const mockSections = () => [
  {
    id: 'section-1',
    title: 'Section 1',
    order_index: 1,
    tasks: [],
  },
];

export const mockTasks = () => [
  {
    id: 'task-1',
    requirement_text: 'Task 1',
    status: 'pending',
    section_id: 'section-1',
  },
];
```

#### 2. 使用 Test Helpers
```typescript
// test-helpers.ts
export const renderHookWithSections = (sections: Section[]) => {
  return renderHook(() => useProposalState(sections));
};

export const createMockSupabase = () => ({
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ error: null }),
  update: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockResolvedValue({ error: null }),
  eq: jest.fn().mockResolvedValue({ error: null }),
});
```

#### 3. 使用 Custom Matchers
```typescript
// custom-matchers.ts
expect.extend({
  toHaveBeenCalledWithSection(received, sectionId) {
    const calls = received.mock.calls;
    const pass = calls.some(call => call[0]?.id === sectionId);
    return {
      pass,
      message: () => `Expected to be called with section ${sectionId}`,
    };
  },
});
```

---

## 📊 成功指標

### 量化指標
- ✅ **代碼覆蓋率**: 70%+ (Statements, Branches, Functions, Lines)
- ✅ **測試通過率**: 95%+ (允許5%的已知問題)
- ✅ **測試執行時間**: < 5s (單模塊測試)
- ✅ **測試維護成本**: < 20% 代碼變更需要測試更新

### 質化指標
- ✅ **可讀性**: 測試意圖清晰，易於理解
- ✅ **穩定性**: 測試結果穩定，無間歇性失敗
- ✅ **可維護性**: 測試代碼易於維護和擴展
- ✅ **文檔性**: 測試本身即文檔，描述清晰

---

## 🎯 里程碑檢查點

### Milestone 1: 核心 Hooks 完成 (Week 1 結束)
- [ ] sectionUtils 100% 覆蓋率
- [ ] useProposalOperations 70%+ 覆蓋率
- [ ] 模塊覆蓋率 40%+
- [ ] 所有測試通過

### Milestone 2: 組件測試完成 (Week 2 結束)
- [ ] useProposalDialogs 90%+ 覆蓋率
- [ ] ProposalTree 80%+ 覆蓋率
- [ ] 模塊覆蓋率 60%+

### Milestone 3: 目標達成 (Week 3 結束)
- [ ] **模塊覆蓋率 70%+ ✅**
- [ ] 集成測試套件完成
- [ ] CI/CD 自動化測試配置
- [ ] 測試文檔完整

---

## ✅ QA 簽核

**改進計畫**: ✅ 可行且詳細
**時間估算**: ✅ 合理
**資源需求**: ✅ 明確

**建議**: 優先執行 Week 1 計畫，修復已知問題並完成核心 Hook 測試。

---

**QA 審查官 Sam**
簽署日期: 2026-01-26
