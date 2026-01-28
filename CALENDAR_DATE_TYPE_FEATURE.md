# 行事曆日期類型切換功能說明

## 概述
為行事曆視圖新增日期類型切換功能，允許用戶選擇顯示標案的「發布日期」或「截止日期」。

## 功能實作

### 1. 新增日期類型定義
**檔案**: `frontend/src/components/dashboard/tenders/TenderCalendarView.tsx`

新增 `DateType` 類型：
```typescript
export type DateType = 'publish' | 'deadline';
```

### 2. 更新組件介面
**檔案**: `TenderCalendarView.tsx`

更新 `TenderCalendarViewProps` 介面：
```typescript
interface TenderCalendarViewProps {
    tenders: any[];
    onDayClick?: (date: Date) => void;
    dateType?: DateType;  // 新增：預設為 'deadline'
}
```

### 3. 修改日期篩選邏輯
**檔案**: `TenderCalendarView.tsx`

更新 `getTendersForDay` 函數：
```typescript
const getTendersForDay = (d: number, m: number, y: number) => {
    return tenders.filter(t => {
        const dateStr = dateType === 'publish' ? t.publish_date : t.deadline_date;
        if (!dateStr) return false;

        // Handle both date formats: 'YYYY-MM-DD' and 'YYYY-MM-DD HH:mm:ss'
        const targetDate = new Date(dateStr);
        return (
            targetDate.getDate() === d &&
            targetDate.getMonth() === m &&
            targetDate.getFullYear() === y
        );
    });
};
```

### 4. 更新 UI 顯示文字
**檔案**: `TenderCalendarView.tsx`

動態顯示日期類型標籤：
```typescript
// 標題下方
<p className="...">
    TENDER_TIMELINE // {dateType === 'publish' ? 'PUBLICATION_MAP' : 'DEADLINE_MAP'}
</p>

// 頁尾
<div className="...">
    {dateType === 'publish' ? 'PUBLISH_CYCLE' : 'DEADLINE_CYCLE'}: {month + 1}.{year}
</div>
```

### 5. 新增日期類型選擇器
**檔案**: `frontend/src/components/dashboard/tenders/TenderList.tsx`

#### 5.1 引入必要組件
```typescript
import { TenderCalendarView, DateType } from "./TenderCalendarView"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
```

#### 5.2 新增狀態管理
```typescript
const [dateType, setDateType] = React.useState<DateType>('deadline')
```

#### 5.3 在工具列新增選擇器
```typescript
{viewMode === 'calendar' && (
    <Select value={dateType} onValueChange={(value) => setDateType(value as DateType)}>
        <SelectTrigger className="w-[160px] h-10 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-xs font-bold uppercase tracking-wider">
            <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none border-black dark:border-white">
            <SelectItem value="deadline" className="font-mono text-xs font-bold uppercase">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#FA4028]"></span>
                    截止日期
                </span>
            </SelectItem>
            <SelectItem value="publish" className="font-mono text-xs font-bold uppercase">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#285AFA]"></span>
                    發布日期
                </span>
            </SelectItem>
        </SelectContent>
    </Select>
)}
```

#### 5.4 更新資料查詢
```typescript
// 在 fetchAllTendersForCalendar 函數中
let query = supabase
    .from('tenders')
    .select('id, title, publish_date, deadline_date, url, org_name')  // 新增 deadline_date
    .in('keyword_tag', activeKeywords)
```

#### 5.5 傳遞 dateType 給 TenderCalendarView
```typescript
<TenderCalendarView
    tenders={allTendersForCalendar}
    dateType={dateType}  // 新增：傳遞日期類型
    onDayClick={(date) => {
        setSelectedDate(date);
        setViewMode('grid');
    }}
/>
```

## UI/UX 設計

### 選擇器位置
- 位於行事曆工具列，視圖切換按鈕左側
- 只在行事曆視圖顯示

### 選擇器樣式
- 寬度：160px
- 高度：40px (與其他工具按鈕一致)
- 邊框：黑色 (淺色模式) / 白色 (暗色模式)
- 字體：Mono、粗體、大寫、間距增寬
- 圖示：截止日期 (紅色 #FA4028)、發布日期 (藍色 #285AFA)

### 預設值
- 預設顯示「截止日期」(對投標者更實用)

## 測試

### 測試檔案
`frontend/src/__tests__/components/dashboard/tenders/TenderCalendarView.test.tsx`

### 測試案例
1. ✅ 預設顯示截止日期
2. ✅ 切換為發布日期顯示
3. ✅ 按截止日期篩選標案
4. ✅ 按發布日期篩選標案
5. ✅ 處理空標案陣列
6. ✅ 處理缺少日期的標案
7. ✅ 點擊日期觸發回調

### 執行測試
```bash
cd frontend
npm test -- TenderCalendarView.test.tsx
```

## 資料庫需求

### 確認欄位存在
確保 `tenders` 表包含以下欄位：
- `publish_date`: 發布日期 (DATE 或 TEXT)
- `deadline_date`: 截止日期 (TIMESTAMP 或 TEXT，支援時間)

### 資料格式
支援兩種日期格式：
1. `YYYY-MM-DD` (純日期)
2. `YYYY-MM-DD HH:mm:ss` (日期時間)

## 使用方式

### 用戶操作流程
1. 進入標案列表頁面
2. 切換至「行事曆視圖」
3. 在工具列看到「截止日期」下拉選擇器
4. 點擊選擇器，選擇「發布日期」或「截止日期」
5. 行事曆自動更新，按選擇的日期類型顯示標案

### 效果
- 選擇「截止日期」：標案顯示在其截止日期的格子中
- 選擇「發布日期」：標案顯示在其發布日期的格子中
- UI 標籤同步更新：「DEADLINE_MAP」↔「PUBLICATION_MAP」

## 效能考量

### 優化點
1. ✅ 只在行事曆視圖加載時查詢完整資料
2. ✅ 日期篩選在前端執行（避免頻繁 API 請求）
3. ✅ 使用 React state 管理選擇，無需重新查詢

### 資料量
- 一次性載入所有訂閱關鍵字的標案
- 前端篩選和分組，不增加伺服器負擔

## 相容性

### 瀏覽器
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

### 響應式設計
- 桌面：完整顯示選擇器
- 平板：完整顯示選擇器
- 手機：選擇器可能需要額外適配（待測試）

## 未來改進建議

1. **持久化選擇**：將用戶選擇存儲到 localStorage
2. **快捷切換**：新增鍵盤快捷鍵（如 'D' 切換到截止日期，'P' 切換到發布日期）
3. **同時顯示**：考慮在同一天顯示不同顏色標記（發布用藍色，截止用紅色）
4. **日期範圍篩選**：新增「顯示過去日期」選項
5. **通知提醒**：截止日期臨近時顯示警告標記

## 檔案清單

### 修改的檔案
1. `frontend/src/components/dashboard/tenders/TenderCalendarView.tsx`
2. `frontend/src/components/dashboard/tenders/TenderList.tsx`

### 新增的檔案
1. `frontend/src/__tests__/components/dashboard/tenders/TenderCalendarView.test.tsx`

## 驗證清單

- [x] DateType 類型定義正確
- [x] TenderCalendarView 接受 dateType prop
- [x] getTendersForDay 根據 dateType 篩選
- [x] UI 標籤動態顯示
- [x] TenderList 新增 dateType 狀態
- [x] 日期類型選擇器正確實作
- [x] fetchAllTendersForCalendar 包含 deadline_date
- [x] TenderCalendarView 接收 dateType prop
- [x] 測試案例覆蓋主要功能
- [x] 文件完整

## 部署注意事項

1. **資料庫檢查**：確認 `tenders.deadline_date` 欄位已填充資料
2. **快取清理**：部署後清理前端快取
3. **用戶通知**：在發布說明中告知用戶新功能

---

**實作完成日期**: 2026-01-28
**實作者**: 前端工程師 Ava
