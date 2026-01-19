# Table of Contents 導航功能實現說明

## 概述
為 SOURCE DETAILS 側邊欄添加了章節快速導航功能，用戶可以點擊章節標題快速跳轉到文件的對應位置。

## 實現細節

### 新增組件
**文件**: `src/components/workspace/TableOfContents.tsx`

#### 功能特性
1. **自動解析章節結構**
   - 支持兩種格式：
     - 目錄格式：`[章節標題 頁碼](.)`
     - Markdown 標題：`## 章節標題`
   - 自動提取章節標題、層級和頁碼信息
   - 智能清理編號（壹、貳、參等中文數字或阿拉伯數字）

2. **可折疊導航面板**
   - 默認展開，顯示所有章節
   - 點擊標題欄可折疊/展開
   - 顯示章節總數

3. **視覺設計**
   - 符合 Swiss/Brutalist 設計風格
   - 黑白配色，方正字體
   - 懸停效果：黑底白字
   - 活躍項目：高亮顯示（黑底白字 + 加粗）
   - 層級縮進：每級 12px

4. **交互功能**
   - 點擊章節項目：自動滾動到對應位置
   - 平滑滾動效果 (`behavior: 'smooth'`)
   - 章節高亮：點擊後標記活躍狀態

### 更新的組件
**文件**: `src/components/workspace/SourceDetailPanel.tsx`

#### 主要變更
1. **新增導航處理邏輯**
   ```typescript
   const handleNavigate = (itemId: string) => {
       // 解析章節索引
       // 計算滾動位置
       // 平滑滾動到目標
   }
   ```

2. **集成 TableOfContents**
   - 只在完整內容視圖中顯示（非 citation 視圖）
   - 位於 header 和內容區域之間
   - 傳遞 content 和 onNavigate 回調

3. **滾動容器 refs**
   - `contentRef`: 內容區域引用
   - `contentContainerRef`: 滾動容器引用
   - 用於計算和控制滾動位置

## 技術實現

### 章節解析算法
```typescript
function parseTableOfContents(content: string): TocItem[]
```
- 分兩階段解析：
  1. 首先尋找明確的目錄區段
  2. 若無目錄區段，則解析 markdown 標題
- 支持多級標題（1-3 級）
- 清理編號和格式

### 滾動定位算法
```typescript
const handleNavigate = (itemId: string) => {
    // 1. 找到目標章節在文本中的行號
    // 2. 計算該行之前的字符數
    // 3. 估算滾動位置（字符數 * 0.15px）
    // 4. 平滑滾動到目標位置
}
```

**注意**:
- 使用字符計數估算位置（假設平均每字符 0.15px 高度）
- 實際效果受字體大小、行高影響
- 如需更精確定位，可考慮使用 `scrollIntoView` 或 DOM 測量

## 使用場景

### 適用於
- 長文檔（多章節/多頁）
- 結構化內容（有清晰章節劃分）
- 需要快速導航的文檔

### 不顯示於
- Citation 詳情視圖（只顯示引用片段）
- 無章節結構的文檔
- 短文檔（自動檢測，無章節則隱藏）

## UI/UX 設計決策

### 設計原則
1. **最小化視覺干擾**
   - 可折疊設計，不占用過多空間
   - 最大高度限制 240px，超出部分滾動

2. **清晰的視覺層級**
   - 標題欄：10px 字號，全大寫，灰色
   - 章節項：11px 字號，左對齊
   - 頁碼：9px 字號，右對齊，半透明

3. **即時反饋**
   - 懸停效果：明確的黑白反轉
   - 活躍狀態：加粗 + 黑底白字
   - 平滑滾動：視覺連貫性

4. **響應式**
   - 暗色模式支持
   - 適應不同屏幕尺寸

## 潛在改進

### 可選增強功能
1. **當前章節高亮**
   - 使用 Intersection Observer API
   - 滾動時自動更新活躍章節
   - 提升用戶定位感

2. **更精確的滾動定位**
   - 使用 DOM 測量替代字符估算
   - 為每個章節添加錨點元素
   - 使用 `scrollIntoView` API

3. **搜索功能**
   - 在目錄中搜索章節
   - 高亮匹配項

4. **展開/折疊子章節**
   - 支持多級章節的展開/折疊
   - 類似樹狀結構

5. **鍵盤導航**
   - 支持方向鍵在章節間移動
   - 支持 Enter 鍵跳轉

## 代碼質量

### 遵循規範
- ✅ TypeScript 嚴格類型
- ✅ 無 ESLint 錯誤/警告
- ✅ React hooks 最佳實踐（useMemo 避免不必要的重渲染）
- ✅ 語義化 HTML（button 元素用於可點擊項）
- ✅ 無障礙考量（可鍵盤訪問的按鈕）

### 性能優化
- `useMemo` 緩存章節解析結果
- 只在 content 變化時重新解析
- 避免不必要的 state 更新

## 測試建議

### 手動測試檢查清單
- [ ] 有目錄格式的文檔正確解析
- [ ] Markdown 標題格式正確解析
- [ ] 點擊章節項目正確跳轉
- [ ] 折疊/展開功能正常工作
- [ ] 活躍狀態正確更新
- [ ] 暗色模式顯示正常
- [ ] 無章節的文檔不顯示導航
- [ ] Citation 視圖不顯示導航

### 自動化測試建議
```typescript
describe('TableOfContents', () => {
    it('should parse toc format correctly', () => {
        // 測試目錄格式解析
    });

    it('should parse markdown headings', () => {
        // 測試 markdown 標題解析
    });

    it('should call onNavigate when clicking item', () => {
        // 測試導航回調
    });

    it('should toggle collapsed state', () => {
        // 測試折疊功能
    });
});
```

## 文件清單

### 新增文件
- `src/components/workspace/TableOfContents.tsx` (173 行)

### 修改文件
- `src/components/workspace/SourceDetailPanel.tsx` (+70 行)

### 說明文件
- `frontend/docs/table-of-contents-feature.md` (本文件)
