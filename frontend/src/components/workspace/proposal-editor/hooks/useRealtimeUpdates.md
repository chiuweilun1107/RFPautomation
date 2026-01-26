# useRealtimeUpdates Hook

## 概述

`useRealtimeUpdates` 是一個用於管理 Supabase 實時訂閱的自定義 React Hook。它負責訂閱項目相關表的變更（sections、tasks、project_sources），並自動更新本地狀態。

## 功能特性

### ✅ 實時數據同步
- **Sections 表訂閱**：監聽章節的創建、更新、刪除
- **Tasks 表訂閱**：監聽任務的創建、更新、刪除
- **Project Sources 表訂閱**：監聽項目來源的關聯和取消關聯

### ✅ 錯誤處理與重連
- 自動檢測連接錯誤
- 自動重連機制（最多 5 次嘗試）
- 重連間隔 3 秒
- 詳細的錯誤日誌記錄

### ✅ 性能優化
- 使用 `useRef` 避免不必要的重新訂閱
- 防止重複插入相同的資料
- 只在相關欄位變更時才更新狀態

### ✅ 內存管理
- 組件卸載時自動清理訂閱
- 清理重連 timeout
- 重置重連計數器

## 使用方式

### 基本用法

```tsx
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates';
import { useSectionState } from './hooks/useSectionState';

function ProposalEditor({ projectId }: { projectId: string }) {
  // 初始化狀態管理
  const sectionState = useSectionState(projectId);

  // 設置實時訂閱
  useRealtimeUpdates(projectId, sectionState);

  return (
    <div>
      {/* 你的組件內容 */}
    </div>
  );
}
```

### 與 ProposalStructureEditor 整合

```tsx
import { useProposalState } from './hooks/useProposalState';
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates';

function ProposalStructureEditor({ projectId }: Props) {
  // 狀態管理
  const state = useProposalState();

  // 創建適配器供 useRealtimeUpdates 使用
  const sectionStateAdapter = {
    sections: state.sections,
    setSections: state.setSections,
    sources: state.sources,
    setSources: state.setSources,
    linkedSourceIds: state.linkedSourceIds,
    setLinkedSourceIds: state.setLinkedSourceIds,
    taskContents: state.taskContents,
    setTaskContents: state.setTaskContents,
    loading: state.loading,
    setLoading: state.setLoading,
    fetchData: async () => { /* 實現數據獲取邏輯 */ },
    fetchTaskContents: async () => { /* 實現任務內容獲取邏輯 */ },
  };

  // 啟用實時訂閱
  useRealtimeUpdates(projectId, sectionStateAdapter);

  return (
    <div>
      {/* 編輯器內容 */}
    </div>
  );
}
```

## API 參考

### 參數

```typescript
useRealtimeUpdates(
  projectId: string,
  sectionState: UseSectionStateReturn
): void
```

#### `projectId`
- **類型**: `string`
- **必需**: 是
- **描述**: 當前項目的唯一標識符。用於過濾只訂閱當前項目的變更。

#### `sectionState`
- **類型**: `UseSectionStateReturn`
- **必需**: 是
- **描述**: 包含狀態和狀態更新方法的對象。

**`UseSectionStateReturn` 接口**:
```typescript
interface UseSectionStateReturn {
  // 狀態
  sections: Section[];
  sources: Source[];
  linkedSourceIds: string[];
  taskContents: Map<string, TaskContent>;
  loading: boolean;

  // 狀態更新方法
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  setLinkedSourceIds: React.Dispatch<React.SetStateAction<string[]>>;
  setTaskContents: React.Dispatch<React.SetStateAction<Map<string, TaskContent>>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // 數據獲取方法
  fetchData: () => Promise<void>;
  fetchTaskContents: () => Promise<void>;
}
```

## 實時事件處理

### Sections 表變更

#### INSERT 事件
當新章節被創建時：
1. 轉換數據庫格式為應用格式
2. 檢查是否已存在（避免重複）
3. 添加到 sections 數組
4. 觸發 UI 更新

#### UPDATE 事件
當章節被修改時：
1. 找到對應的章節
2. 合併新數據
3. 更新 sections 數組
4. 觸發 UI 更新

#### DELETE 事件
當章節被刪除時：
1. 從 sections 數組中移除
2. 觸發 UI 更新

### Tasks 表變更

#### INSERT 事件
當新任務被創建時：
1. 轉換數據庫格式為應用格式
2. 找到對應的章節
3. 檢查是否已存在（避免重複）
4. 添加到章節的 tasks 數組
5. 觸發 UI 更新

#### UPDATE 事件
當任務被修改時：
1. 找到包含該任務的章節
2. 更新任務數據
3. 觸發 UI 更新

#### DELETE 事件
當任務被刪除時：
1. 找到包含該任務的章節
2. 從 tasks 數組中移除
3. 觸發 UI 更新

### Project Sources 表變更

#### INSERT 事件
當新來源被關聯到項目時：
1. 更新 linkedSourceIds 數組
2. 從數據庫獲取完整的 source 資料
3. 添加到 sources 數組
4. 觸發 UI 更新

#### DELETE 事件
當來源從項目中移除時：
1. 從 linkedSourceIds 數組中移除
2. 從 sources 數組中移除
3. 觸發 UI 更新

## 錯誤處理

### 連接錯誤
當訂閱連接失敗時：
```typescript
[Realtime] Connection error: <error details>
[Realtime] Attempting to reconnect (1/5)...
```

### 最大重連次數
當達到最大重連次數（5次）時：
```typescript
[Realtime] Max reconnection attempts reached. Please refresh the page.
```

### 超時錯誤
當連接超時時：
```typescript
[Realtime] Connection timed out
```

## 日誌記錄

Hook 提供詳細的控制台日誌，方便調試：

- `[Realtime] Setting up realtime subscriptions for project: <projectId>`
- `[Realtime] Successfully subscribed to project updates`
- `[Realtime] Section change: <eventType> <payload>`
- `[Realtime] Task change: <eventType> <payload>`
- `[Realtime] Project source change: <eventType> <payload>`
- `[Realtime] Cleaning up subscriptions`

## 最佳實踐

### ✅ 推薦做法

1. **只訂閱一次**：在組件樹的較高層級調用此 hook，避免重複訂閱
   ```tsx
   // ✅ 在頂層組件
   function ProposalEditor() {
     useRealtimeUpdates(projectId, sectionState);
     return <ProposalContent />;
   }
   ```

2. **確保清理**：依賴 React 的清理機制，不需要手動清理
   ```tsx
   // ✅ Hook 會自動在 unmount 時清理
   useEffect(() => {
     // 訂閱邏輯
     return () => {
       // 自動清理
     };
   }, [projectId]);
   ```

3. **處理初始數據**：先加載初始數據，再啟用實時訂閱
   ```tsx
   // ✅ 正確順序
   useEffect(() => {
     fetchInitialData();
   }, []);

   useRealtimeUpdates(projectId, sectionState);
   ```

### ❌ 避免的做法

1. **不要在列表項中訂閱**
   ```tsx
   // ❌ 錯誤：會創建多個訂閱
   function SectionItem({ section, projectId }) {
     useRealtimeUpdates(projectId, sectionState); // 錯誤！
     return <div>{section.title}</div>;
   }
   ```

2. **不要頻繁變更 projectId**
   ```tsx
   // ❌ 錯誤：會導致頻繁重新訂閱
   function Editor() {
     const [projectId, setProjectId] = useState(initialId);
     useRealtimeUpdates(projectId, sectionState); // 每次 projectId 變更都會重新訂閱
   }
   ```

3. **不要忽略錯誤**
   ```tsx
   // ❌ 錯誤：應該監控錯誤並通知用戶
   // ✅ 正確：Hook 已經處理錯誤並記錄日誌
   ```

## 性能考慮

### 優化策略

1. **防止重複更新**：Hook 在更新前檢查數據是否已存在
2. **使用 useRef**：避免不必要的重新創建 Supabase client
3. **批量更新**：使用 React 的批量更新機制
4. **過濾器優化**：只訂閱當前項目的變更

### 內存占用

- **輕量級**：只維護必要的 ref 和訂閱連接
- **自動清理**：組件卸載時釋放所有資源
- **無內存洩漏**：正確清理 timeout 和訂閱

## 測試

### 單元測試

參考測試文件：`useRealtimeUpdates.test.ts`

測試覆蓋：
- ✅ 訂閱設置
- ✅ 訂閱清理
- ✅ Section INSERT/UPDATE/DELETE 事件
- ✅ Task INSERT/UPDATE/DELETE 事件
- ✅ Project Source INSERT/DELETE 事件
- ✅ 錯誤處理和重連
- ✅ 重複數據防護

### 集成測試

```tsx
import { render, waitFor } from '@testing-library/react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

describe('Real-time Integration', () => {
  it('should update UI when section is created', async () => {
    const { getByText } = render(<ProposalEditor projectId="test" />);

    // 觸發實時事件
    await triggerRealtimeInsert('sections', newSection);

    // 驗證 UI 更新
    await waitFor(() => {
      expect(getByText(newSection.title)).toBeInTheDocument();
    });
  });
});
```

## 故障排除

### 問題：訂閱未生效

**症狀**：其他用戶的變更沒有實時顯示

**解決方案**：
1. 檢查 Supabase 項目設置中是否啟用了 Realtime
2. 檢查表的 RLS 策略是否允許讀取
3. 檢查控制台是否有錯誤日誌
4. 驗證 projectId 是否正確

### 問題：內存洩漏

**症狀**：頁面使用時間越長越卡頓

**解決方案**：
1. 確保組件卸載時正確清理訂閱
2. 檢查是否在列表項中誤用了 hook
3. 使用 React DevTools Profiler 分析

### 問題：數據不一致

**症狀**：本地狀態與數據庫不同步

**解決方案**：
1. 檢查是否正確處理了所有事件類型（INSERT/UPDATE/DELETE）
2. 驗證數據轉換邏輯是否正確
3. 確保初始數據加載完成後再啟用訂閱
4. 檢查是否有手動修改數據的邏輯導致衝突

## 技術細節

### 訂閱頻道配置

```typescript
const channel = supabase.channel(`project-${projectId}-realtime`, {
  config: {
    broadcast: { self: false }, // 不接收自己發送的廣播
    presence: { key: '' },       // 不使用 presence 功能
  },
});
```

### 重連機制

```typescript
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 秒

// 指數退避策略（可選）
const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
```

## 未來改進

- [ ] 支援自定義重連策略
- [ ] 添加連接狀態指示器
- [ ] 支援離線隊列
- [ ] 添加性能監控指標
- [ ] 支援選擇性訂閱（只訂閱特定表）

## 相關資源

- [Supabase Realtime 文檔](https://supabase.com/docs/guides/realtime)
- [React Hooks 最佳實踐](https://react.dev/reference/react)
- [useSectionState Hook](./useSectionState.md)
- [ProposalStructureEditor](../ProposalStructureEditor.tsx)

## 授權

MIT License
