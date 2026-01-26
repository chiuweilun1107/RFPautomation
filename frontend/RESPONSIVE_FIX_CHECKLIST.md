# 響應式設計修復檢查清單

**項目**: NotebookLM Frontend
**設計師**: UI/UX 設計師 Mia
**日期**: 2026-01-26

---

## 🎯 修復目標

確保所有組件在以下尺寸下正常運作：
- 📱 Mobile: 320px - 640px
- 📱 Tablet: 641px - 1024px
- 💻 Desktop: 1025px+

---

## 🔍 檢查項目

### Priority 1: 固定寬度問題

#### 1. SourceDetailPanel (Draggable Dialog)
**檔案**: `components/workspace/SourceManager.tsx`
**行號**: 805

**問題**:
```tsx
// ❌ 固定寬度
<div className="... w-[580px] h-[80vh] ...">
```

**修復**:
```tsx
// ✅ 響應式寬度
<div className="... w-full sm:w-[580px] max-w-[95vw] h-[80vh] max-h-[90vh] ...">
```

**狀態**: 🔄 待修復

---

#### 2. DraggableContentPanel
**檔案**: `components/workspace/DraggableContentPanel.tsx`

**檢查清單**:
- [ ] 檢查是否有固定寬度 `w-[xxx]`
- [ ] 添加響應式斷點 `sm:`, `md:`, `lg:`
- [ ] 測試移動端拖曳行為
- [ ] 添加 `max-w-[95vw]` 防止溢出

**狀態**: 🔄 待檢查

---

#### 3. Dialog 組件們

**需要檢查的 Dialog**:
- [ ] AddSourceDialog
- [ ] AddTaskDialog
- [ ] ContentGenerationDialog
- [ ] ImageGenerationDialog
- [ ] GenerateSubsectionDialog
- [ ] TemplateUploadDialog

**修復模式**:
```tsx
// ❌ 僅有最大寬度
<DialogContent className="sm:max-w-[425px]">

// ✅ 完整響應式
<DialogContent className="w-full max-w-[95vw] sm:max-w-[425px] md:max-w-[600px]">
```

**狀態**: 🔄 待檢查

---

### Priority 2: 卡片佈局優化

#### 4. TemplateList Grid
**檔案**: `components/templates/TemplateList.tsx`
**行號**: 279

**當前**:
```tsx
<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

**檢查**:
- [x] 移動端單列 ✅
- [x] 平板雙列 ✅
- [x] 桌面多列 ✅
- [ ] 測試 gap 在小螢幕是否過大 (gap-8 → gap-4 md:gap-8)

**建議優化**:
```tsx
<div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

**狀態**: ⚠️ 需要測試

---

#### 5. KnowledgeList Grid
**檔案**: `components/knowledge/KnowledgeList.tsx`
**行號**: 140

**當前**:
```tsx
<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
```

**建議優化**:
```tsx
<div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**狀態**: ⚠️ 建議優化

---

### Priority 3: 表格溢出處理

#### 6. KnowledgeList Table (List View)
**檔案**: `components/knowledge/KnowledgeList.tsx`
**行號**: 234

**當前**:
```tsx
<div className="border-[1.5px] ... overflow-hidden">
    <Table>
```

**問題**: 移動端表格可能橫向溢出

**修復**:
```tsx
<div className="border-[1.5px] ... overflow-hidden">
    <div className="overflow-x-auto -mx-4 sm:mx-0">
        <Table className="min-w-[640px]">
```

**狀態**: 🔄 待修復

---

#### 7. TemplateList Table (List View)
**檔案**: `components/templates/TemplateList.tsx`
**行號**: 357

**當前**:
```tsx
<div className="border-[1.5px] ... overflow-hidden rounded-none">
```

**修復**:
```tsx
<div className="border-[1.5px] ... overflow-hidden rounded-none">
    <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="hidden md:grid ...">  {/* 表頭僅桌面顯示 */}
```

**狀態**: 🔄 待修復

---

### Priority 4: ProposalStructureEditor 複雜佈局

#### 8. ProposalStructureEditor
**檔案**: `components/workspace/ProposalStructureEditor.tsx`

**檢查清單**:
- [ ] 側邊欄在移動端的行為
- [ ] 拖拽功能在觸控螢幕的支援
- [ ] 嵌套結構的折疊/展開
- [ ] 按鈕群組在小螢幕的顯示

**建議**:
- 移動端使用 Sheet 代替側邊欄
- 觸控螢幕顯示拖拽提示
- 默認折疊深層結構

**狀態**: 🔄 需要深入檢查

---

### Priority 5: 移動端優化

#### 9. SourceManager
**檔案**: `components/workspace/SourceManager.tsx`

**檢查清單**:
- [ ] 搜索欄在移動端的寬度
- [ ] AI 搜索結果列表橫向溢出
- [ ] 來源卡片在小螢幕的顯示
- [ ] Dropdown menu 在移動端的可點擊性

**當前問題區域**:
```tsx
// 行 508-516: 搜索與過濾欄
<div className="relative flex-1">
    <Input className="pl-8 h-8 ..." />
</div>
```

**建議**: 移動端堆疊顯示
```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
    <Button className="w-full sm:flex-1 ...">
    <div className="relative w-full sm:flex-1">
```

**狀態**: 🔄 待優化

---

## 🛠️ 修復步驟

### Step 1: 快速修復 (1-2 小時)

```bash
# 1. 修復 Dialog 固定寬度
# 搜索所有 Dialog 並添加響應式類
grep -r "DialogContent" src/components --include="*.tsx" | grep -v "w-full"

# 2. 修復表格溢出
# 在所有 Table 外添加 overflow-x-auto 容器
```

**具體行動**:
1. ✅ 複製以下修復模板
2. 🔄 應用到所有 Dialog
3. 🔄 應用到所有 Table

**Dialog 修復模板**:
```tsx
<DialogContent className="w-full max-w-[95vw] sm:max-w-[425px] md:max-w-[600px] rounded-none border-2 border-black dark:border-white">
```

**Table 修復模板**:
```tsx
<div className="overflow-x-auto -mx-4 sm:mx-0">
    <Table className="min-w-[640px]">
        {/* ... */}
    </Table>
</div>
```

---

### Step 2: 佈局優化 (2-3 小時)

**Grid 間距優化**:
```bash
# 搜索所有 grid gap-8
grep -r "grid.*gap-8" src/components --include="*.tsx"

# 替換為響應式 gap
gap-8 → gap-4 md:gap-8
```

**Flex 方向優化**:
```bash
# 搜索固定 flex-row
grep -r "flex.*justify-between" src/components --include="*.tsx"

# 添加響應式方向
flex → flex-col sm:flex-row
```

---

### Step 3: 移動端特殊處理 (3-4 小時)

**SourceManager 優化**:
```tsx
// 移動端搜索欄
<div className="flex flex-col sm:flex-row gap-2">
    <Button className="w-full sm:flex-1">Add Source</Button>
    <div className="relative w-full sm:flex-1">
        <Input className="w-full" />
    </div>
</div>
```

**ProposalEditor 移動端**:
```tsx
// 使用 Sheet 代替側邊欄
<Sheet>
    <SheetTrigger asChild>
        <Button className="md:hidden">Open Menu</Button>
    </SheetTrigger>
    <SheetContent side="left">
        {/* 側邊欄內容 */}
    </SheetContent>
</Sheet>
```

---

## 🧪 測試清單

### 測試設備/尺寸

- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPad Mini (744px)
- [ ] iPad Pro (1024px)
- [ ] Desktop 1440px
- [ ] Desktop 1920px

### 測試場景

#### 場景 1: 空狀態顯示
- [ ] 移動端圖標大小適中
- [ ] 文字不會溢出
- [ ] 按鈕可完整顯示

#### 場景 2: 列表/表格
- [ ] 卡片在移動端單列
- [ ] 表格可橫向滾動
- [ ] 文字不會被截斷

#### 場景 3: Dialog/Modal
- [ ] 不會超出螢幕邊界
- [ ] 關閉按鈕可點擊
- [ ] 內容可完整顯示

#### 場景 4: 拖拽功能
- [ ] 觸控螢幕支援
- [ ] 拖拽區域夠大
- [ ] 視覺反饋清楚

---

## 📊 進度追蹤

| 項目 | 優先級 | 狀態 | 預估時間 | 實際時間 |
|------|--------|------|----------|----------|
| SourceDetailPanel 寬度 | P1 | 🔄 待修復 | 15min | - |
| Dialog 響應式 | P1 | 🔄 待修復 | 30min | - |
| 表格溢出處理 | P1 | 🔄 待修復 | 30min | - |
| Grid 間距優化 | P2 | ⚠️ 需測試 | 20min | - |
| SourceManager 移動端 | P2 | 🔄 待優化 | 45min | - |
| ProposalEditor 移動端 | P3 | 🔄 待檢查 | 2hr | - |

**總預估時間**: 約 5 小時
**建議分配**: 2 個工作日

---

## 🚀 快速修復腳本

### 腳本 1: 查找固定寬度

```bash
#!/bin/bash
# find-fixed-widths.sh

echo "🔍 查找固定寬度組件..."
echo ""

echo "1. Dialog 固定寬度:"
grep -rn "DialogContent" src/components --include="*.tsx" | grep -v "w-full" | grep -v "max-w"

echo ""
echo "2. 固定 w-[xxx] 類:"
grep -rn 'className.*w-\[' src/components --include="*.tsx" | grep -v "md:" | grep -v "sm:" | head -20

echo ""
echo "3. 固定 grid-cols-[數字] 無響應式:"
grep -rn 'grid-cols-[0-9]' src/components --include="*.tsx" | grep -v "sm:" | grep -v "md:" | head -20
```

### 腳本 2: 批量添加響應式

```bash
#!/bin/bash
# add-responsive.sh

# 備份
cp -r src/components src/components.backup

# 替換 Dialog
find src/components -name "*.tsx" -exec sed -i '' 's/DialogContent className="/DialogContent className="w-full max-w-[95vw] /g' {} \;

# 替換 gap-8
find src/components -name "*.tsx" -exec sed -i '' 's/grid gap-8/grid gap-4 md:gap-8/g' {} \;

echo "✅ 批量替換完成，請檢查 git diff"
```

---

## 💡 最佳實踐提醒

### DO ✅

1. **始終使用響應式類**
   ```tsx
   className="w-full sm:w-[425px] md:w-[600px]"
   ```

2. **移動優先設計**
   ```tsx
   // 默認移動端，然後添加桌面樣式
   className="flex-col sm:flex-row"
   ```

3. **使用 max-w 防止溢出**
   ```tsx
   className="w-full max-w-[95vw]"
   ```

4. **表格加滾動容器**
   ```tsx
   <div className="overflow-x-auto">
       <Table className="min-w-[640px]" />
   </div>
   ```

### DON'T ❌

1. **不要使用固定寬度**
   ```tsx
   // ❌ 固定寬度
   className="w-[320px]"
   ```

2. **不要忽略移動端**
   ```tsx
   // ❌ 沒有移動端處理
   className="grid-cols-4"
   ```

3. **不要假設螢幕大小**
   ```tsx
   // ❌ 假設用戶有大螢幕
   className="min-w-[1200px]"
   ```

---

## 📝 修復記錄

### 2026-01-26
- ✅ 創建響應式修復檢查清單
- 🔄 待修復 SourceDetailPanel 寬度
- 🔄 待檢查所有 Dialog 組件

### 待更新...

---

**檢查清單結束**

如有任何響應式問題，請參考此檢查清單逐項修復。

-- UI/UX 設計師 Mia
