# ProposalStructureEditor 架構圖

## 整體架構

```
┌─────────────────────────────────────────────────────────────┐
│                ProposalStructureEditor (index.tsx)          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ useProposalState│  │useProposalDialogs│  │ Operations  │ │
│  │   (狀態管理)     │  │  (Dialog狀態)    │  │  (CRUD/生成) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                   │        │
└───────────┼─────────────────────┼───────────────────┼────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│                      UI Components                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐                                    │
│  │ ProposalHeader   │  ← 頂部工具欄                      │
│  │  - 生成章節      │                                    │
│  │  - 新增章節      │                                    │
│  │  - 進度顯示      │                                    │
│  └──────────────────┘                                    │
│           │                                               │
│           ▼                                               │
│  ┌──────────────────┐                                    │
│  │  ProposalTree    │  ← 章節樹形結構                    │
│  │  - 章節列表      │                                    │
│  │  - 任務列表      │                                    │
│  │  - 拖拽排序      │                                    │
│  └──────────────────┘                                    │
│           │                                               │
│           ▼                                               │
│  ┌───────────────────────────────────────────┐           │
│  │          ProposalDialogs                  │           │
│  ├───────────────────────────────────────────┤           │
│  │ ┌─────────────────┐ ┌─────────────────┐  │           │
│  │ │AddSectionDialog │ │ AddTaskDialog   │  │           │
│  │ └─────────────────┘ └─────────────────┘  │           │
│  │ ┌─────────────────┐ ┌─────────────────┐  │           │
│  │ │AddSubsection    │ │ GenerateSubsec. │  │           │
│  │ └─────────────────┘ └─────────────────┘  │           │
│  │ ┌─────────────────┐ ┌─────────────────┐  │           │
│  │ │ContentGeneration│ │ ImageGeneration │  │           │
│  │ └─────────────────┘ └─────────────────┘  │           │
│  │ ┌─────────────────────────────────────┐  │           │
│  │ │   ConflictConfirmationDialogs (3)   │  │           │
│  │ └─────────────────────────────────────┘  │           │
│  └───────────────────────────────────────────┘           │
│           │                                               │
│           ▼                                               │
│  ┌──────────────────────┐                                │
│  │ FloatingContentPanels│  ← 浮動內容面板                │
│  │  - 拖動              │                                │
│  │  - 複製/下載         │                                │
│  │  - 展開/收縮         │                                │
│  └──────────────────────┘                                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## 數據流

### 1. 用戶操作 → 狀態更新 → UI 渲染

```
用戶點擊「新增章節」
     │
     ▼
dialogs.openAddSection()
     │
     ▼
isAddSectionOpen = true
     │
     ▼
AddSectionDialog 渲染
     │
     ▼
用戶輸入標題並確認
     │
     ▼
handleAddSection()
     │
     ▼
operations.addSection()
     │
     ▼
Supabase Insert
     │
     ▼
fetchData()
     │
     ▼
sections 狀態更新
     │
     ▼
ProposalTree 重新渲染
```

### 2. AI 生成流程

```
用戶選擇源文獻 + 點擊「技術規約生成」
     │
     ▼
檢查是否有現有任務
     │
     ├─ 有 → 打開衝突 Dialog
     │       │
     │       ├─ 保留並新增 → generateTasks(append)
     │       └─ 全部取代 → deleteExisting + generateTasks
     │
     └─ 無 → 直接 generateTasks()
             │
             ▼
         調用 /api/webhook/generate-tasks
             │
             ▼
         n8n workflow 執行
             │
             ▼
         任務生成並存入 DB
             │
             ▼
         fetchData() 重新載入
             │
             ▼
         UI 更新顯示新任務
```

## Hook 職責劃分

### useProposalState
**職責**: 統一狀態管理
- ✅ 章節數據
- ✅ 展開狀態
- ✅ 編輯狀態
- ✅ 源文獻選擇
- ✅ 生成進度
- ✅ 內容管理

### useProposalDialogs
**職責**: Dialog 狀態管理
- ✅ 所有 Dialog 開關狀態
- ✅ Dialog 輸入數據
- ✅ Dialog 上下文信息
- ✅ 待處理的異步操作

### useProposalOperations
**職責**: 業務操作邏輯
- ✅ 章節 CRUD
- ✅ 任務 CRUD
- ✅ 拖拽處理
- ✅ AI 生成
- ✅ 內容整合

## 組件職責

### ProposalHeader (100 行)
- 顯示章節統計
- 生成章節按鈕
- 新增章節按鈕
- 生成進度顯示

### ProposalDialogs (317 行)
- 統一渲染所有對話框
- 傳遞 props 到各個 Dialog
- 管理 Dialog 的開關狀態

### FloatingContentPanels (228 行)
- 浮動面板渲染
- 拖動功能
- 複製/下載功能
- 展開/收縮切換

### ProposalTree
- 章節樹形結構渲染
- 拖拽上下文
- 章節項委派

## 性能優化策略

### 1. Memoization
```typescript
// 計算值緩存
const totalSections = useMemo(() => countSections(sections), [sections]);
const completedSections = useMemo(() => countCompleted(sections), [sections]);
const flatSections = useMemo(() => flattenSections(sections), [sections]);
```

### 2. 回調優化
```typescript
// 所有事件處理函數使用 useCallback
const handleAddSection = useCallback(async () => { ... }, [deps]);
const handleGenerateTasks = useCallback(async () => { ... }, [deps]);
```

### 3. 條件渲染
```typescript
// 只在需要時渲染浮動面板
{openContentPanels.size > 0 && (
  <FloatingContentPanels ... />
)}
```

## 無障礙支援

### 鍵盤導航
- ✅ Tab 鍵導航所有可互動元素
- ✅ Enter/Space 鍵觸發按鈕
- ✅ Escape 鍵關閉 Dialog

### ARIA 標籤
- ✅ Dialog 使用 `role="dialog"`
- ✅ 按鈕使用 `aria-label`
- ✅ 進度條使用 `aria-valuenow`

### 對比度
- ✅ 文字對比度 ≥ 4.5:1
- ✅ 互動元素對比度 ≥ 3:1

## 錯誤處理

### 1. API 錯誤
```typescript
try {
  await operations.addSection(title);
} catch (error: any) {
  toast.error(`添加失敗: ${error.message}`);
}
```

### 2. 衝突處理
```typescript
// 檢查衝突
if (hasExistingData) {
  openConflictDialog();
} else {
  performOperation();
}
```

### 3. 樂觀更新 + 回滾
```typescript
// 1. 樂觀更新 UI
setSections(updatedSections);

// 2. 調用 API
const { error } = await supabase.update(...);

// 3. 失敗時回滾
if (error) {
  await fetchData(); // 重新載入正確數據
}
```

---

**設計原則**:
1. **關注點分離**: Hooks 管理狀態，組件負責 UI
2. **單一職責**: 每個組件只做一件事
3. **可組合性**: 組件可獨立使用和測試
4. **類型安全**: 完整的 TypeScript 類型定義
5. **用戶體驗**: 即時反饋、優雅的錯誤處理
