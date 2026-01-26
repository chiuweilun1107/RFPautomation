# Console.log 清理指南

## 快速參考

### 當前狀態
- ✅ 生產環境自動移除 console.log（Next.js compiler 配置）
- ✅ ESLint 警告規則已啟用
- ⚠️  剩餘約 103 個 console.log 在開發代碼中

### 檢查命令

```bash
# 統計剩餘的 console.log 數量
grep -r "console\.log\|console\.info\|console\.debug" src --include="*.ts" --include="*.tsx" | grep -v "test-" | wc -l

# 查看包含 console.log 的文件列表
grep -r "console\.log" src --include="*.ts" --include="*.tsx" | grep -v "test-" | cut -d: -f1 | sort -u

# 查看特定文件的 console.log 位置
grep -n "console\.log" src/components/your-component.tsx
```

## 清理策略

### 1. 完全移除（適用於簡單調試）

**移除前**：
```typescript
console.log('[Debug] Processing data:', data);
console.log('Value:', value);
```

**移除後**：
```typescript
// 直接刪除
```

### 2. 開發環境條件判斷（適用於有價值的調試信息）

**移除前**：
```typescript
console.log('[Component] State updated:', state);
```

**替換為**：
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[Component] State updated:', state);
}
```

### 3. 使用結構化 Logger（適用於重要日誌）

**移除前**：
```typescript
console.log('[API] Request:', method, path);
console.log('[Error]', error);
```

**替換為**：
```typescript
import { logger } from '@/lib/errors/logger';

logger.debug('API Request', 'API', { method, path });
logger.error('Request failed', error, 'API');
```

**Logger 方法**：
- `logger.error()` - 錯誤日誌（保留在生產環境）
- `logger.warn()` - 警告日誌（保留在生產環境）
- `logger.info()` - 信息日誌（生產環境可配置）
- `logger.debug()` - 調試日誌（僅開發環境）

### 4. 保留規則

**保留以下 console 調用**：
- ✅ `console.error()` - 錯誤日誌
- ✅ `console.warn()` - 警告日誌
- ✅ 測試文件中的 console.log (test-*.tsx, *.test.tsx)

**移除以下 console 調用**：
- ❌ `console.log()`
- ❌ `console.info()`
- ❌ `console.debug()`

## 批量清理腳本使用

### 使用內置清理腳本

```bash
cd frontend

# 預覽模式（不實際修改文件）
node scripts/remove-console-logs.mjs --dry-run

# 詳細模式（顯示所有文件處理情況）
node scripts/remove-console-logs.mjs --dry-run --verbose

# 實際執行清理
node scripts/remove-console-logs.mjs

# 檢查清理結果
git diff src
```

### 使用正則表達式批量替換

**VS Code 搜索替換**：
1. 打開 VS Code 搜索（Cmd/Ctrl + Shift + F）
2. 啟用正則表達式模式
3. 搜索：`^\s*console\.log\([^)]*\);?\s*\n`
4. 替換：留空
5. 在 `src` 目錄中執行替換

**注意**：正則表達式可能無法處理多行 console.log，需要手動審查。

## 文件優先級

### 高優先級（影響用戶體驗）
1. API Routes (`src/app/api/**/*.ts`)
2. 核心組件 (`src/components/workspace/**`)
3. Hooks (`src/hooks/**`)

### 中優先級（開發體驗）
4. 編輯器組件 (`src/components/editor/**`)
5. 模板組件 (`src/components/templates/**`)
6. 知識庫組件 (`src/components/knowledge/**`)

### 低優先級（可保留）
7. 測試頁面 (`src/app/test-*/**`)
8. 腳本文件 (`scripts/**`)

## 常見模式

### 模式 1：調試數據流

**移除前**：
```typescript
const handleSubmit = async (data) => {
  console.log('Form data:', data);
  await submit(data);
  console.log('Submit complete');
};
```

**移除後**：
```typescript
const handleSubmit = async (data) => {
  await submit(data);
};
```

### 模式 2：追蹤狀態變化

**移除前**：
```typescript
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

**替換為**：
```typescript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Component] State changed:', state);
  }
}, [state]);
```

### 模式 3：API 請求日誌

**移除前**：
```typescript
const response = await fetch(url);
console.log('Response:', response);
```

**替換為**：
```typescript
import { logger } from '@/lib/errors/logger';

const response = await fetch(url);
logger.debug('API Response received', 'API', {
  url,
  status: response.status
});
```

## 驗證清理結果

### 1. 統計檢查
```bash
# 清理前統計
before=$(grep -r "console\.log" src --include="*.ts" --include="*.tsx" | wc -l)

# 執行清理...

# 清理後統計
after=$(grep -r "console\.log" src --include="*.ts" --include="*.tsx" | wc -l)

echo "移除: $((before - after)) 個 console.log"
```

### 2. ESLint 檢查
```bash
cd frontend
npx eslint src --ext .ts,.tsx | grep "no-console"
```

### 3. 生產 Bundle 驗證
```bash
cd frontend
npm run build
npm run analyze

# 查看 bundle 中是否還有 console.log
grep -r "console.log" .next/static/chunks/*.js || echo "✅ 生產 bundle 已清理"
```

## 防止回歸

### 1. Git Pre-commit Hook

創建 `.husky/pre-commit`：
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 檢查暫存文件中的 console.log
if git diff --cached --name-only | grep -E '\.(ts|tsx)$' | xargs grep -l "console\.log\|console\.info\|console\.debug" > /dev/null; then
  echo "⚠️  警告：發現 console.log，請使用 logger 或移除"
  echo "提示：如果必須使用，請使用 git commit --no-verify"
  exit 1
fi
```

### 2. CI/CD 檢查

在 `.github/workflows/lint.yml`：
```yaml
- name: Check console.log
  run: |
    if grep -r "console\.log" src --include="*.ts" --include="*.tsx" | grep -v "test-"; then
      echo "❌ 發現 console.log，請移除或使用 logger"
      exit 1
    fi
```

### 3. Code Review 檢查清單

- [ ] 無新增 console.log
- [ ] 錯誤處理使用 console.error 或 logger.error
- [ ] 調試日誌使用 logger.debug（開發環境）
- [ ] 生產環境日誌使用 logger.info/warn/error

## 相關文件

- **配置**：`next.config.ts` - 生產環境移除配置
- **ESLint**：`eslint.config.mjs` - 警告規則
- **Logger**：`src/lib/errors/logger.ts` - 結構化日誌工具
- **清理腳本**：`scripts/remove-console-logs.mjs` - 批量清理工具

## 常見問題

### Q: 為什麼生產環境還需要手動清理？
A: 實際上不需要。Next.js 的 `removeConsole` 配置已經在打包時自動移除所有 console.log。手動清理主要是為了保持代碼整潔和改善開發體驗。

### Q: 應該使用什麼替代 console.log？
A:
- 錯誤：`console.error()` 或 `logger.error()`
- 警告：`console.warn()` 或 `logger.warn()`
- 調試：`logger.debug()`（僅開發環境）
- 信息：`logger.info()`

### Q: 測試文件中的 console.log 需要移除嗎？
A: 不需要。測試文件中的 console.log 有助於調試測試，可以保留。

### Q: 如何查看生產環境是否真的移除了 console.log？
A:
```bash
npm run build
grep -r "console\.log" .next/static/chunks/*.js
```

如果沒有輸出，說明已成功移除。

## 總結

✅ **生產環境已優化** - Next.js 自動移除
✅ **ESLint 已配置** - 防止新增
✅ **Logger 工具可用** - 結構化日誌
⚠️  **開發代碼可清理** - 改善開發體驗（可選）

**建議優先級**：
1. 高：確保生產環境配置正確（已完成）
2. 中：新代碼使用 logger 替代 console.log
3. 低：清理現有開發代碼中的 console.log（可選）
