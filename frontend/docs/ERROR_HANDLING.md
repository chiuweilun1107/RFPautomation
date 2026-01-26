# 統一錯誤處理系統

## 概述

本項目採用統一的錯誤處理機制，確保所有錯誤都被正確記錄、展示給用戶，並提供一致的用戶體驗。

## 核心組件

### 1. Error Classes (`lib/errors/`)

位於 `lib/errors/` 的錯誤類系統：

```typescript
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalError,
  // ... 其他錯誤類
} from '@/lib/errors';
```

**主要錯誤類**：
- `AppError` - 基礎應用錯誤類
- `BadRequestError` - 400 錯誤
- `UnauthorizedError` - 401 錯誤
- `NotFoundError` - 404 錯誤
- `ValidationError` - 422 驗證錯誤
- `InternalError` - 500 內部錯誤
- `ExternalApiError` - 外部 API 錯誤
- `WorkflowError` - 工作流錯誤

### 2. Logger (`lib/errors/logger.ts`)

結構化日誌系統：

```typescript
import { logger } from '@/lib/errors';

logger.info('Operation completed', 'Context', { metadata });
logger.error('Operation failed', error, 'Context', { metadata });
logger.warn('Warning message', 'Context', { metadata });
logger.debug('Debug info', 'Context', { metadata });
```

### 3. Error Handler Hook (`hooks/useErrorHandler.ts`)

客戶端統一錯誤處理：

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { handleError, handleApiError } = useErrorHandler();

try {
  await someOperation();
} catch (error) {
  handleError(error, {
    context: 'OperationName',
    userMessage: '操作失敗，請重試。',
    metadata: { additionalInfo: 'value' },
  });
}
```

### 4. API Call Hook (`hooks/useApiCall.ts`)

統一 API 調用包裝器：

```typescript
import { useApiPost } from '@/hooks/useApiCall';

const { post, loading, error } = useApiPost<ResponseType>();

const handleSubmit = async (data) => {
  const result = await post('/api/endpoint', data, {
    context: 'CreateResource',
    userMessage: '創建失敗，請重試。',
    enableRetry: true,
  });

  if (result) {
    toast.success('創建成功！');
  }
};
```

### 5. React Query Integration (`hooks/useMutationWithError.ts`)

React Query mutation 包裝器：

```typescript
import { useMutationWithError } from '@/hooks/useMutationWithError';

const { mutate, isPending } = useMutationWithError({
  mutationFn: (data) => createResource(data),
  context: 'CreateResource',
  successMessage: '創建成功！',
  errorMessage: '創建失敗，請重試。',
  invalidateQueries: [['resources']],
  onSuccess: () => {
    // 額外的成功處理
  },
});
```

## 使用指南

### 場景 1: 簡單 API 調用

```typescript
import { useApiPost } from '@/hooks/useApiCall';

function MyComponent() {
  const { post, loading } = useApiPost<ProjectData>();

  const createProject = async (data: FormData) => {
    const result = await post('/api/projects', data, {
      context: 'CreateProject',
      successMessage: '項目創建成功！',
      enableRetry: true,
    });

    if (result) {
      // 處理成功邏輯
      router.push(`/projects/${result.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(createProject)}>
      {/* 表單內容 */}
      <Button disabled={loading}>
        {loading ? '創建中...' : '創建項目'}
      </Button>
    </form>
  );
}
```

### 場景 2: React Query Mutation

```typescript
import { useMutationWithError } from '@/hooks/useMutationWithError';
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  const { mutate: deleteProject, isPending } = useMutationWithError({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    context: 'DeleteProject',
    successMessage: '項目已刪除',
    errorMessage: '刪除失敗，請重試。',
    invalidateQueries: [['projects']],
  });

  return (
    <Button onClick={() => deleteProject(projectId)} disabled={isPending}>
      {isPending ? '刪除中...' : '刪除'}
    </Button>
  );
}
```

### 場景 3: 複雜錯誤處理（手動處理）

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logger } from '@/lib/errors';

function MyComponent() {
  const { handleError, handleApiError, withRetry } = useErrorHandler();

  const complexOperation = async () => {
    try {
      // 步驟 1: 上傳文件
      const file = await uploadFile();
      logger.info('File uploaded', 'ComplexOperation', { fileId: file.id });

      // 步驟 2: 處理文件（帶重試）
      const result = await withRetry(
        () => processFile(file.id),
        {
          context: 'ProcessFile',
          maxRetries: 3,
          retryDelay: 2000,
          onRetry: (attempt) => {
            toast.info(`重試中... (${attempt}/3)`);
          },
        }
      );

      // 步驟 3: 更新數據庫
      await updateDatabase(result);

      toast.success('操作完成！');
    } catch (error) {
      handleError(error, {
        context: 'ComplexOperation',
        userMessage: '操作失敗。請檢查文件並重試。',
        metadata: { step: 'unknown' },
      });
    }
  };

  return <Button onClick={complexOperation}>執行操作</Button>;
}
```

### 場景 4: Supabase 數據庫操作

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createClient } from '@/lib/supabase/client';

function MyComponent() {
  const { handleDbError } = useErrorHandler();
  const supabase = createClient();

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      return data;
    } catch (error) {
      handleDbError(error, 'FetchProjects', {
        userMessage: '無法載入項目列表。',
        metadata: { filter: 'active' },
      });
      return null;
    }
  };

  // ...
}
```

### 場景 5: 文件操作錯誤

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function UploadComponent() {
  const { handleFileError } = useErrorHandler();

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      toast.success(`文件 ${file.name} 上傳成功！`);
      return result;
    } catch (error) {
      handleFileError(error, 'Upload', file.name, {
        userMessage: `文件 ${file.name} 上傳失敗。`,
        metadata: {
          fileSize: file.size,
          fileType: file.type,
        },
      });
      return null;
    }
  };

  // ...
}
```

## 最佳實踐

### ✅ DO (推薦做法)

1. **使用統一的錯誤處理 Hook**
   ```typescript
   const { handleError } = useErrorHandler();
   handleError(error, { context: 'OperationName' });
   ```

2. **使用 logger 而非 console**
   ```typescript
   logger.info('Operation completed', 'Context');
   logger.error('Operation failed', error, 'Context');
   ```

3. **提供有意義的上下文**
   ```typescript
   handleError(error, {
     context: 'CreateProject',
     userMessage: '項目創建失敗，請檢查輸入並重試。',
     metadata: { projectName: data.name },
   });
   ```

4. **對可重試的操作使用 withRetry**
   ```typescript
   await withRetry(() => apiCall(), {
     context: 'APICall',
     maxRetries: 3,
   });
   ```

5. **使用類型安全的 API 調用**
   ```typescript
   const { post } = useApiPost<ResponseType>();
   await post('/api/endpoint', data, { context: 'Operation' });
   ```

### ❌ DON'T (避免做法)

1. **不要使用 console.error**
   ```typescript
   // ❌ 錯誤
   console.error('Error:', error);

   // ✅ 正確
   logger.error('Error description', error, 'Context');
   ```

2. **不要直接使用 toast.error**
   ```typescript
   // ❌ 錯誤
   toast.error('操作失敗');

   // ✅ 正確
   handleError(error, {
     context: 'Operation',
     userMessage: '操作失敗',
   });
   ```

3. **不要忽略錯誤**
   ```typescript
   // ❌ 錯誤
   try {
     await operation();
   } catch {
     // 靜默失敗
   }

   // ✅ 正確
   try {
     await operation();
   } catch (error) {
     handleError(error, { context: 'Operation' });
   }
   ```

4. **不要提取錯誤消息時使用不一致的方法**
   ```typescript
   // ❌ 錯誤
   const message = error?.message || 'Unknown error';

   // ✅ 正確
   const message = extractErrorMessage(error, 'Default message');
   ```

5. **不要在多個地方重複錯誤處理邏輯**
   ```typescript
   // ❌ 錯誤
   try {
     await operation();
   } catch (error) {
     const message = error instanceof Error ? error.message : 'Error';
     logger.error(message, error);
     toast.error(message);
   }

   // ✅ 正確
   try {
     await operation();
   } catch (error) {
     handleError(error, { context: 'Operation' });
   }
   ```

## 遷移指南

### 從舊的錯誤處理遷移

#### 步驟 1: 替換 console.error

```typescript
// 舊代碼
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('操作失敗');
}

// 新代碼
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { handleError } = useErrorHandler();

try {
  await operation();
} catch (error) {
  handleError(error, {
    context: 'Operation',
    userMessage: '操作失敗',
  });
}
```

#### 步驟 2: 替換直接的 fetch 調用

```typescript
// 舊代碼
const [loading, setLoading] = useState(false);

const createProject = async (data) => {
  setLoading(true);
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed');
    const result = await response.json();
    toast.success('創建成功');
    return result;
  } catch (error) {
    console.error('Error:', error);
    toast.error('創建失敗');
  } finally {
    setLoading(false);
  }
};

// 新代碼
import { useApiPost } from '@/hooks/useApiCall';

const { post, loading } = useApiPost<ProjectData>();

const createProject = async (data) => {
  const result = await post('/api/projects', data, {
    context: 'CreateProject',
  });

  if (result) {
    toast.success('創建成功');
  }
  return result;
};
```

#### 步驟 3: 替換 React Query mutations

```typescript
// 舊代碼
const mutation = useMutation({
  mutationFn: createProject,
  onSuccess: () => {
    toast.success('創建成功');
    queryClient.invalidateQueries(['projects']);
  },
  onError: (error) => {
    console.error('Error:', error);
    toast.error('創建失敗');
  },
});

// 新代碼
import { useMutationWithError } from '@/hooks/useMutationWithError';

const mutation = useMutationWithError({
  mutationFn: createProject,
  context: 'CreateProject',
  successMessage: '創建成功',
  invalidateQueries: [['projects']],
});
```

## 錯誤分類與處理策略

| 錯誤類型 | HTTP 狀態碼 | 處理策略 | 用戶提示示例 |
|---------|------------|---------|-------------|
| `BadRequestError` | 400 | 不重試，提示用戶修正輸入 | "請檢查輸入數據" |
| `UnauthorizedError` | 401 | 重定向到登錄頁面 | "請重新登錄" |
| `ForbiddenError` | 403 | 提示權限不足 | "您沒有執行此操作的權限" |
| `NotFoundError` | 404 | 提示資源不存在 | "請求的資源不存在" |
| `ValidationError` | 422 | 不重試，提示驗證錯誤 | "數據驗證失敗" |
| `InternalError` | 500 | 可重試 | "服務器錯誤，請稍後重試" |
| `ServiceUnavailableError` | 503 | 可重試（帶延遲） | "服務暫時不可用" |
| `ExternalApiError` | 502 | 可重試 | "外部服務錯誤" |

## 測試

### 測試錯誤處理邏輯

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toast } from 'sonner';

jest.mock('sonner');

describe('useErrorHandler', () => {
  it('should handle errors with toast notification', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Test error');
    result.current.handleError(error, {
      context: 'Test',
      userMessage: 'Test failed',
    });

    expect(toast.error).toHaveBeenCalledWith('Test failed', expect.any(Object));
  });

  it('should extract error message correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('API Error');
    const errorInfo = result.current.handleError(error, {
      context: 'Test',
      showToast: false,
    });

    expect(errorInfo.message).toBe('API Error');
  });
});
```

## 常見問題

### Q: 什麼時候應該使用 `handleError` vs `handleApiError`？

**A**:
- `handleError`: 通用錯誤處理，適用於任何類型的錯誤
- `handleApiError`: API 調用錯誤的便捷包裝器，自動設置 `API:` 上下文前綴

### Q: 如何決定是否啟用重試？

**A**:
- 啟用重試: 網絡請求、外部 API 調用、暫時性錯誤
- 不啟用重試: 驗證錯誤、權限錯誤、業務邏輯錯誤

### Q: `userMessage` 和自動提取的錯誤消息有什麼區別？

**A**:
- `userMessage`: 自定義的、用戶友好的錯誤提示（推薦使用）
- 自動提取: 從錯誤對象中提取的原始錯誤消息（可能不夠友好）

### Q: 如何在生產環境隱藏詳細錯誤信息？

**A**:
Logger 和 AppError 會根據 `NODE_ENV` 自動調整詳細程度：
- Development: 完整堆棧追蹤、詳細上下文
- Production: 簡化日誌、隱藏敏感信息

## 參考

- [lib/errors/](../src/lib/errors/) - 錯誤類和處理器
- [hooks/useErrorHandler.ts](../src/hooks/useErrorHandler.ts) - 客戶端錯誤處理 Hook
- [hooks/useApiCall.ts](../src/hooks/useApiCall.ts) - API 調用包裝器
- [hooks/useMutationWithError.ts](../src/hooks/useMutationWithError.ts) - React Query 集成
