# Citation Badge Click Enhancement

## 功能實現總結

### 修改的文件
1. **AssessmentTable.tsx**
2. **SourceDetailPanel.tsx**

### 實現的功能

#### 1. 完整文件顯示 ✅
當用戶點擊 citation badge 時：
- 自動從 Supabase 查詢完整的 source 數據
- 傳遞 `evidence` 和 `source` 給 SourceDetailPanel
- 顯示完整內容而不只是引用片段

#### 2. 引用句子高亮 ✅
- 使用 `useMemo` 優化高亮計算性能
- 在完整內容中查找並高亮 `evidence.quote`
- 支持模糊匹配（處理換行和多餘空格）
- 使用黃色背景高亮：
  - Light mode: `bg-yellow-200`
  - Dark mode: `bg-yellow-800/80`
- 只高亮第一個匹配項

#### 3. 自動滾動 ✅
- 使用 `useEffect` 監聽內容變化
- 當高亮內容渲染後，自動滾動到 `<mark>` 元素
- 使用 `scrollIntoView` 平滑滾動
- 居中顯示：`block: 'center'`

#### 4. PDF 頁面跳轉 ✅
- 當 evidence 包含 `page` 且 source 有 `pages` 數據時
- 自動設置 `currentPage` 為 `evidence.page`
- 在該頁內容中高亮引用句子
- 保持頁面導航功能

### 技術實現細節

#### AssessmentTable.tsx 修改
```typescript
// 1. 添加 state 存儲完整 source
const [selectedSource, setSelectedSource] = useState<any | null>(null);

// 2. 修改 handleCitationClick 為 async 函數
const handleCitationClick = async (evidence: Evidence) => {
    // 查詢完整 source
    const { data: sourceData } = await supabase
        .from('sources')
        .select('*')
        .eq('id', evidence.source_id)
        .maybeSingle();

    setSelectedSource(sourceData);
    setSelectedEvidence(evidence);
};

// 3. 傳遞兩個參數給 SourceDetailPanel
<SourceDetailPanel
    evidence={selectedEvidence}
    source={selectedSource}
    onClose={() => {
        setSelectedEvidence(null);
        setSelectedSource(null);
    }}
/>
```

#### SourceDetailPanel.tsx 修改
```typescript
// 1. 檢測是否顯示完整內容 + 高亮
const showFullContentWithHighlight = !!(evidence && source);

// 2. 智能內容選擇
const content = useMemo(() => {
    if (showFullContentWithHighlight) {
        // PDF: 顯示當前頁
        if (shouldShowPageNavigation && source?.pages) {
            return source.pages[currentPage - 1]?.content;
        }
        // 非 PDF: 顯示完整內容
        return source?.content;
    }
    // 舊行為: 只顯示 quote
    return evidence?.quote || source?.content;
}, [evidence, source, showFullContentWithHighlight, shouldShowPageNavigation, currentPage]);

// 3. 初始化頁碼
useEffect(() => {
    if (evidence?.page && shouldShowPageNavigation) {
        setCurrentPage(evidence.page);
    }
}, [evidence?.page, shouldShowPageNavigation]);

// 4. 高亮內容
const highlightContent = useMemo(() => {
    if (!showFullContentWithHighlight || !evidence?.quote || !content) {
        return null;
    }

    const quote = evidence.quote.trim();
    let startIndex = content.indexOf(quote);

    // 模糊匹配邏輯
    if (startIndex === -1) {
        const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim();
        const normalizedContent = normalizeWhitespace(content);
        const normalizedQuote = normalizeWhitespace(quote);
        const tempIndex = normalizedContent.indexOf(normalizedQuote);

        // 找到原始位置的近似值
        if (tempIndex !== -1) {
            // ... word-based approximation logic
        }
    }

    if (startIndex === -1) {
        return null; // 找不到，返回 null
    }

    // 分割並包裹 <mark>
    return (
        <>
            {content.substring(0, startIndex)}
            <mark className="bg-yellow-200 dark:bg-yellow-800/80 ...">
                {content.substring(startIndex, startIndex + quote.length)}
            </mark>
            {content.substring(startIndex + quote.length)}
        </>
    );
}, [showFullContentWithHighlight, evidence?.quote, content]);

// 5. 自動滾動
useEffect(() => {
    if (showFullContentWithHighlight && evidence?.quote && contentContainerRef.current) {
        const timer = setTimeout(() => {
            const markElement = contentContainerRef.current?.querySelector('mark');
            if (markElement) {
                markElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }
}, [showFullContentWithHighlight, evidence?.quote, currentPage, content]);

// 6. 渲染高亮內容
<div className="...">
    {showFullContentWithHighlight && highlightContent
        ? highlightContent
        : content || "(No content available)"}
</div>
```

### UI 改進

#### 1. 資訊橫幅
```tsx
{showFullContentWithHighlight && (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-800 dark:text-yellow-200">
            📍 Showing full document with highlighted citation
        </p>
    </div>
)}
```

#### 2. 隱藏重複的 Quote 區塊
- 當顯示完整內容時，不再單獨顯示 Quote 區塊
- 避免內容重複

#### 3. 動態標題
- 顯示 "FULL CONTENT" 或 "PAGE N CONTENT"
- 顯示字符數統計

### 性能優化

1. **useMemo**
   - `content` 計算使用 useMemo
   - `highlightContent` 計算使用 useMemo
   - 避免每次渲染都重新計算

2. **useEffect 延遲**
   - 滾動操作延遲 100ms
   - 確保 DOM 渲染完成

3. **模糊匹配優化**
   - 優先精確匹配
   - 失敗後才嘗試標準化匹配
   - 基於詞數而不是字符數近似位置

### 測試場景

#### ✅ 測試場景 1：點擊 Badge（非 PDF）
- 點擊 badge
- 應顯示完整 content
- quote 應該被黃色高亮
- 自動滾動到高亮位置
- 顯示黃色資訊橫幅

#### ✅ 測試場景 2：點擊 Badge（PDF）
- 點擊 badge
- 自動跳轉到 evidence.page
- 在該頁內容中高亮 quote
- 自動滾動到高亮位置
- 頁面導航依然可用

#### ✅ 測試場景 3：高亮顏色
- Light mode: 清晰的黃色背景
- Dark mode: 深黃色背景，保持可讀性

#### ✅ 測試場景 4：長文檔
- 滾動動畫流暢
- 高亮計算不卡頓（useMemo）

#### ✅ 測試場景 5：Quote 多次出現
- 只高亮第一個匹配項

#### ✅ 測試場景 6：Quote 包含換行
- 模糊匹配能找到含有換行的 quote

### 已知限制

1. **模糊匹配精度**
   - 當 quote 包含大量空格變化時，位置可能不完全準確
   - 使用詞數近似，而非絕對精確

2. **找不到匹配**
   - 如果 quote 在 content 中不存在（數據不一致），不會高亮
   - 返回 null，顯示原始內容

3. **效能考量**
   - 長文檔（>100K 字符）的高亮計算可能需要幾毫秒
   - 已使用 useMemo 最佳化

### 未來增強（可選）

1. **正則表達式匹配**
   - 更靈活的模糊匹配
   - 忽略標點符號差異

2. **多次高亮**
   - 支持高亮所有匹配項（目前只高亮第一個）

3. **高亮顏色自定義**
   - 從設計系統讀取顏色
   - 支持不同引用類型使用不同顏色

4. **虛擬滾動**
   - 對於超長文檔（>1MB），使用虛擬滾動提升性能

## 總結

✅ 功能已完整實現
✅ 支持 PDF 頁面跳轉
✅ 高亮與自動滾動工作正常
✅ 性能優化到位（useMemo）
✅ Light/Dark 模式都支持
✅ 代碼結構清晰，易於維護
