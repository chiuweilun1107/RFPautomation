# 🚀 實時訂閱功能快速集成指南

## 📖 簡介

本指南將幫助你在 5 分鐘內將實時訂閱功能集成到 ProposalStructureEditor 中。

## ⚡ 快速開始

### 第一步：檢查依賴

確保已安裝必要的依賴：

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 第二步：配置環境變量

確保 `.env.local` 包含 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 第三步：在組件中使用

在 `ProposalStructureEditor.tsx` 中添加以下代碼：

```typescript
import { useRealtimeUpdates } from './proposal-editor/hooks/useRealtimeUpdates';

function ProposalStructureEditor({ projectId }: Props) {
  const state = useProposalState();

  // 創建適配器
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
    fetchData: fetchData, // 你的數據獲取函數
    fetchTaskContents: fetchTaskContents, // 你的任務內容獲取函數
  };

  // 啟用實時訂閱（就這麼簡單！）
  useRealtimeUpdates(projectId, sectionStateAdapter);

  return (
    <div>
      {/* 你的 UI 組件 */}
    </div>
  );
}
```

### 第四步：啟用 Supabase Realtime

在 Supabase Dashboard 中：

1. 進入 **Database** → **Replication**
2. 啟用以下表的 Realtime：
   - ✅ `sections`
   - ✅ `tasks`
   - ✅ `project_sources`

### 第五步：測試

打開兩個瀏覽器窗口，登錄同一個項目：

1. 在窗口 A 創建一個新章節
2. 窗口 B 應該立即看到新章節出現 ✨

## 🔍 調試

打開瀏覽器控制台，查看實時訂閱日誌：

```
[Realtime] Setting up realtime subscriptions for project: xxx
[Realtime] Successfully subscribed to project updates
[Realtime] Section change: INSERT { ... }
```

## ⚠️ 常見問題

### 問題 1: 看不到實時更新

**解決方案**:
1. 檢查 Supabase Realtime 是否已啟用
2. 檢查控制台是否有錯誤日誌
3. 確認 RLS 策略允許讀取

### 問題 2: 連接頻繁斷開

**解決方案**:
1. 檢查網絡連接
2. 查看 Supabase 服務狀態
3. 檢查防火牆設置

### 問題 3: 性能問題

**解決方案**:
1. 確保只在組件樹的高層調用一次 hook
2. 使用 React.memo 避免不必要的重渲染
3. 考慮使用虛擬滾動處理大量數據

## 📚 更多資源

- [完整技術文檔](./src/components/workspace/proposal-editor/hooks/useRealtimeUpdates.md)
- [使用示例](./src/components/workspace/proposal-editor/hooks/useRealtimeUpdates.example.tsx)
- [實現總結](./REALTIME_IMPLEMENTATION_SUMMARY.md)
- [Supabase Realtime 文檔](https://supabase.com/docs/guides/realtime)

## ✅ 驗收測試

運行以下命令驗證實現：

```bash
# 驗證腳本
./scripts/verify-realtime-implementation.sh

# 運行測試
npm test useRealtimeUpdates

# TypeScript 檢查
npx tsc --noEmit
```

## 🎯 下一步

1. 集成到 ProposalStructureEditor ✅
2. 測試多用戶同時編輯
3. 部署到測試環境
4. 監控實時連接穩定性
5. 收集用戶反饋

## 💡 最佳實踐提醒

- ✅ 只在組件樹的高層調用 hook
- ✅ 先加載初始數據，再啟用訂閱
- ✅ 監控連接狀態並提供用戶反饋
- ❌ 不要在列表項中使用 hook
- ❌ 不要頻繁切換 projectId

---

**需要幫助?** 查看 [故障排除指南](./REALTIME_IMPLEMENTATION_SUMMARY.md#故障排除)

**準備好了?** 開始集成！🚀
