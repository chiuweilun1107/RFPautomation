# 錯誤處理系統統一 - 遷移報告

## 🎯 目標

建立統一的前端錯誤處理機制，確保：
- 所有錯誤都被正確記錄
- 用戶收到一致的、友好的錯誤提示
- 錯誤處理邏輯集中且可維護

## ✅ 已完成工作

### 1. 核心基礎設施（100% 完成）

#### 創建的新工具

1. **`hooks/useErrorHandler.ts`** - 統一錯誤處理 Hook
   - ✅ `handleError()` - 通用錯誤處理
   - ✅ `handleApiError()` - API 錯誤處理
   - ✅ `handleDbError()` - 數據庫錯誤處理
   - ✅ `handleFileError()` - 文件操作錯誤處理
   - ✅ `withRetry()` - 自動重試包裝器
   - ✅ `createSafeAsync()` - 安全異步包裝器

2. **`hooks/useApiCall.ts`** - API 調用統一包裝器
   - ✅ `useApiCall()` - 基礎 API 調用 Hook
   - ✅ `useApiPost()` - POST 請求便捷 Hook
   - ✅ `useApiGet()` - GET 請求便捷 Hook
   - ✅ `useApiPut()` - PUT 請求便捷 Hook
   - ✅ `useApiDelete()` - DELETE 請求便捷 Hook

3. **`hooks/useMutationWithError.ts`** - React Query 集成
   - ✅ `useMutationWithError()` - Mutation 錯誤處理
   - ✅ `useQueryErrorOptions()` - Query 錯誤選項
   - ✅ `useInvalidatingMutation()` - 自動失效 Mutation

4. **`docs/ERROR_HANDLING.md`** - 完整文檔
   - ✅ 使用指南
   - ✅ 最佳實踐
   - ✅ 遷移指南
   - ✅ 常見問題
   - ✅ 5+ 實際使用場景示例

5. **`scripts/check-error-handling.sh`** - 遷移進度檢查工具
   - ✅ 統計現有錯誤處理模式
   - ✅ 追蹤遷移進度
   - ✅ 識別需要更新的文件

### 2. 已遷移的文件（示範實現）

#### Features
- ✅ `features/projects/hooks/useProjects.ts`
  - 替換 `console.error` → `logger.error`
  - 替換零散錯誤處理 → `handleApiError`, `handleDbError`
  - 添加結構化日誌記錄

#### Workspace Components
- ✅ `components/workspace/tender-planning/hooks/useAIGeneration.ts`
  - 替換所有 `console.log/error` → `logger.info/error`
  - 統一 3 個工作流的錯誤處理（WF04, WF10, WF11/WF13）
  - 添加詳細的上下文和元數據

## 📊 當前狀態（統計數據）

```
總 TypeScript 文件數: 390
已使用新錯誤處理的文件: 7
遷移進度: 1%

待處理項目:
- ❌ console.error/warn/log 使用次數: 401
- ⚠️ toast 直接調用次數: 268
- 🔍 try-catch 塊數量: 239

已實現:
- ✅ useErrorHandler 使用次數: 14
- ✅ useApiCall 使用次數: 8
- ✅ useMutationWithError 使用次數: 3
- ✅ logger 使用次數: 13
```

## 🎯 遷移策略

### Phase 1: 核心基礎設施（已完成 ✅）
- [x] 創建 `useErrorHandler` Hook
- [x] 創建 `useApiCall` Hook
- [x] 創建 `useMutationWithError` Hook
- [x] 撰寫完整文檔
- [x] 創建檢查工具
- [x] 示範遷移 2 個關鍵文件

### Phase 2: 批量遷移（進行中 - 建議分批進行）

優先級順序：

#### 高優先級（核心業務邏輯）
1. **Features** (features/**)
   - ✅ `features/projects/hooks/useProjects.ts` （已完成）
   - ⏳ `features/text-removal/components/TextRemovalTool.tsx`
   - ⏳ 其他 features

2. **Workspace Hooks** (components/workspace/**/hooks/)
   - ✅ `tender-planning/hooks/useAIGeneration.ts` （已完成）
   - ⏳ `tender-planning/hooks/useSaveOperations.ts`
   - ⏳ `tender-planning/hooks/useTenderData.ts`
   - ⏳ `proposal-editor/hooks/*.ts` (4+ 文件)

#### 中優先級（UI 組件）
3. **Templates & Knowledge** (components/templates/, components/knowledge/)
   - ⏳ `components/templates/*.tsx` (7 個文件)
   - ⏳ `components/knowledge/*.tsx` (3 個文件)

4. **Editor Components** (components/editor/)
   - ⏳ `components/editor/*.tsx` (多個文件)

#### 低優先級（測試和其他）
5. **Dashboard Components**
   - ⏳ `components/dashboard/*.tsx`

6. **App Pages**
   - ⏳ `app/dashboard/**/*.tsx`

### Phase 3: API Routes（後續）
- ⏳ 所有 `app/api/**/*.ts` 文件
- 注意：API routes 使用服務端錯誤處理（已有 `lib/errors/error-handler.ts`）

## 🔧 遷移模式參考

### 模式 1: 簡單錯誤處理替換

**之前：**
```typescript
try {
  await operation();
} catch (error) {
  console.error('Error:', error);
  toast.error('操作失敗');
}
```

**之後：**
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { handleError } = useErrorHandler();

try {
  await operation();
} catch (error) {
  handleError(error, {
    context: 'OperationName',
    userMessage: '操作失敗',
  });
}
```

### 模式 2: API 調用替換

**之前：**
```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    toast.error('加載失敗');
  } finally {
    setLoading(false);
  }
};
```

**之後：**
```typescript
import { useApiGet } from '@/hooks/useApiCall';

const { get, loading } = useApiGet<DataType>();

const fetchData = async () => {
  return await get('/api/endpoint', {
    context: 'FetchData',
    userMessage: '加載失敗',
  });
};
```

### 模式 3: React Query Mutation 替換

**之前：**
```typescript
const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => {
    toast.success('創建成功');
    queryClient.invalidateQueries(['resources']);
  },
  onError: (error) => {
    console.error('Create error:', error);
    toast.error('創建失敗');
  },
});
```

**之後：**
```typescript
import { useMutationWithError } from '@/hooks/useMutationWithError';

const mutation = useMutationWithError({
  mutationFn: createResource,
  context: 'CreateResource',
  successMessage: '創建成功',
  errorMessage: '創建失敗',
  invalidateQueries: [['resources']],
});
```

## 📋 檢查清單

每個遷移的文件應確保：

- [ ] 移除所有 `console.error`, `console.warn`, `console.log`
- [ ] 使用 `logger.error/warn/info/debug` 替代
- [ ] 所有 try-catch 塊使用 `handleError` 或相關方法
- [ ] API 調用使用 `useApiCall` 或 `useMutationWithError`
- [ ] 提供有意義的 `context` 和 `userMessage`
- [ ] 添加適當的 `metadata` 用於調試
- [ ] 測試錯誤場景確保用戶體驗良好

## 🚀 下一步行動

### 立即可做
1. **運行檢查工具**：
   ```bash
   ./scripts/check-error-handling.sh
   ```

2. **選擇下一批文件遷移**（建議從 workspace hooks 開始）：
   - `components/workspace/tender-planning/hooks/useSaveOperations.ts`
   - `components/workspace/tender-planning/hooks/useTenderData.ts`

3. **遵循文檔和模式**：
   - 參考 `docs/ERROR_HANDLING.md`
   - 遵循已遷移文件的模式

### 長期計劃
1. **逐步遷移所有文件**（建議每週遷移 10-20 個文件）
2. **添加 ESLint 規則**禁止直接使用 `console.error` 和 `toast.error`
3. **建立 CI 檢查**確保新代碼使用統一錯誤處理
4. **收集用戶反饋**改進錯誤提示文案

## 📚 參考資源

- **文檔**: `docs/ERROR_HANDLING.md`
- **示範代碼**:
  - `features/projects/hooks/useProjects.ts`
  - `components/workspace/tender-planning/hooks/useAIGeneration.ts`
- **工具**: `scripts/check-error-handling.sh`
- **核心 Hooks**:
  - `hooks/useErrorHandler.ts`
  - `hooks/useApiCall.ts`
  - `hooks/useMutationWithError.ts`

## ✨ 預期效果

完成遷移後將實現：

1. **一致的用戶體驗**
   - 所有錯誤提示格式統一
   - 錯誤消息清晰友好
   - 自動重試可重試的錯誤

2. **更好的可維護性**
   - 錯誤處理邏輯集中
   - 易於添加新功能（如錯誤追蹤服務）
   - 減少代碼重複

3. **完整的可觀測性**
   - 所有錯誤都被記錄
   - 結構化日誌便於分析
   - 生產環境錯誤追蹤更容易

4. **開發體驗提升**
   - 清晰的錯誤處理模式
   - 類型安全
   - 減少樣板代碼

---

**報告生成時間**: 2026-01-26
**當前遷移進度**: 1% (7/390 文件)
**預計完成時間**: 分批進行，建議 4-6 週完成核心文件遷移
