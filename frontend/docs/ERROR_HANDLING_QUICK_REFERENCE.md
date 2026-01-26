# 錯誤處理快速參考

## 🎯 一句話總結

**不要使用 `console.error` 和直接的 `toast.error`，使用統一的錯誤處理 Hooks。**

---

## 📦 導入

```typescript
// 客戶端錯誤處理
import { useErrorHandler } from '@/hooks/useErrorHandler';

// API 調用
import { useApiPost, useApiGet } from '@/hooks/useApiCall';

// React Query
import { useMutationWithError } from '@/hooks/useMutationWithError';

// 日誌
import { logger } from '@/lib/errors';
```

---

## 🔥 常用模式（複製粘貼即可）

### 1️⃣ 簡單錯誤處理

```typescript
const { handleError } = useErrorHandler();

try {
  await someOperation();
} catch (error) {
  handleError(error, {
    context: 'OperationName',
    userMessage: '操作失敗，請重試',
  });
}
```

### 2️⃣ API POST 請求

```typescript
const { post, loading } = useApiPost<ResponseType>();

const handleSubmit = async (data: FormData) => {
  const result = await post('/api/endpoint', data, {
    context: 'CreateResource',
    enableRetry: true, // 可選：自動重試
  });

  if (result) {
    toast.success('創建成功！');
  }
};
```

### 3️⃣ API GET 請求

```typescript
const { get, loading } = useApiGet<DataType>();

useEffect(() => {
  const fetchData = async () => {
    const data = await get('/api/endpoint', {
      context: 'FetchData',
    });
    if (data) setData(data);
  };
  fetchData();
}, []);
```

### 4️⃣ React Query Mutation

```typescript
const { mutate, isPending } = useMutationWithError({
  mutationFn: (data: FormData) => createResource(data),
  context: 'CreateResource',
  successMessage: '創建成功！',
  errorMessage: '創建失敗，請重試',
  invalidateQueries: [['resources']],
});

// 使用
<Button onClick={() => mutate(formData)} disabled={isPending}>
  {isPending ? '創建中...' : '創建'}
</Button>
```

### 5️⃣ Supabase 操作

```typescript
const { handleDbError } = useErrorHandler();

try {
  const { data, error } = await supabase
    .from('table')
    .select('*');

  if (error) throw error;
  return data;
} catch (error) {
  handleDbError(error, 'FetchData', {
    userMessage: '無法載入數據',
  });
  return null;
}
```

### 6️⃣ 文件上傳

```typescript
const { handleFileError } = useErrorHandler();

const handleUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');

    toast.success(`${file.name} 上傳成功！`);
  } catch (error) {
    handleFileError(error, 'Upload', file.name);
  }
};
```

### 7️⃣ 帶重試的操作

```typescript
const { withRetry } = useErrorHandler();

const reliableOperation = async () => {
  return await withRetry(
    () => unstableApiCall(),
    {
      context: 'UnstableAPI',
      maxRetries: 3,
      retryDelay: 2000,
      onRetry: (attempt) => {
        toast.info(`重試中... (${attempt}/3)`);
      },
    }
  );
};
```

### 8️⃣ 日誌記錄（取代 console.log）

```typescript
import { logger } from '@/lib/errors';

// 資訊日誌
logger.info('Operation started', 'Context', { userId: 123 });

// 錯誤日誌
logger.error('Operation failed', error, 'Context', { step: 'validation' });

// 警告日誌
logger.warn('Deprecated feature used', 'Context');

// 調試日誌（僅開發環境）
logger.debug('Debug info', 'Context', { data: complexObject });
```

---

## ⚡ 對照表（新 vs 舊）

| ❌ 舊方式 | ✅ 新方式 |
|---------|---------|
| `console.error('Error:', error)` | `logger.error('Description', error, 'Context')` |
| `toast.error('Failed')` | `handleError(error, { context: 'Op', userMessage: 'Failed' })` |
| `try { await fetch(...) } catch(e) { ... }` | `const { post } = useApiPost(); await post(...)` |
| `useMutation({ onError: ... })` | `useMutationWithError({ context: '...', errorMessage: '...' })` |

---

## 🎨 Context 命名規範

```typescript
// ✅ 好的 context 命名
context: 'CreateProject'
context: 'DeleteUser'
context: 'UploadFile'
context: 'FetchProjects'
context: 'UpdateSettings'

// ❌ 不好的 context 命名
context: 'Error'
context: 'API'
context: 'Component'
```

---

## 📝 快速決策樹

```
需要處理錯誤？
├─ 是 API 調用？
│  ├─ 是 → useApiCall / useApiPost / useApiGet
│  └─ 否 ↓
├─ 是 React Query？
│  ├─ 是 → useMutationWithError
│  └─ 否 ↓
├─ 是數據庫操作？
│  ├─ 是 → handleDbError
│  └─ 否 ↓
├─ 是文件操作？
│  ├─ 是 → handleFileError
│  └─ 否 ↓
└─ 通用錯誤 → handleError
```

---

## 🚨 必須記住

1. **絕不使用** `console.error` → 使用 `logger.error`
2. **絕不直接調用** `toast.error` → 使用 `handleError`
3. **總是提供** `context` 和 `userMessage`
4. **重要操作** 添加 `metadata` 用於調試
5. **可重試操作** 設置 `enableRetry: true`

---

## 📚 完整文檔

詳細文檔請參考：`docs/ERROR_HANDLING.md`

---

## 🔧 檢查工具

```bash
# 運行錯誤處理檢查
./scripts/check-error-handling.sh
```

---

**記住：統一的錯誤處理 = 更好的用戶體驗 + 更容易維護的代碼！** 🎉
