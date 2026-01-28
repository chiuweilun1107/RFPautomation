# 🔧 n8n 工作流修正指南

**問題**：77.5% 的標案缺少 deadline_date
**根本原因**：HTML 解析邏輯不夠完善

---

## 🎯 診斷結果

### **問題確認**

從工作流代碼分析發現：

1. **依賴順序有問題**
   ```javascript
   let deadlineStr = originalItem.end_date;  // ❌ AceBidX 搜尋 API 沒有提供

   if (!deadlineStr && html) {
       // 才用 HTML 解析
   }
   ```

2. **HTML 解析關鍵字太少**
   ```javascript
   const keywords = ['截止投標', '截止'];  // ❌ 缺少 'DEADLINE' 等關鍵字
   ```

3. **搜尋範圍限制**
   ```javascript
   if (distance > 0 && distance < 3000 ...)  // ❌ 只向後搜尋，範圍太小
   ```

---

## 🛠️ 修正方案

### **立即修改：改進 Process Dates 節點**

請打開 n8n Dashboard：http://localhost:5678

#### **步驟 1：編輯工作流**

1. 找到 "Tender Aggregation Workflow"
2. 點擊編輯
3. 找到 "Process Dates" 節點
4. 複製以下改進後的代碼：

```javascript
// Process Dates and Status (IMPROVED VERSION)
// 改進 deadline_date 提取邏輯

const items = $input.all();
const splitResults = $('Split Results').all();

return items.map((inputItem, index) => {
    const originalItem = (splitResults.length > index) ? splitResults[index].json : {};
    const html = inputItem.json.data || '';

    // 1. Handle Status Logic
    let status = '招標中';
    const title = originalItem.project_name || '';
    if (title.includes('更正') || title.includes('取消') || title.includes('廢標') || title.includes('撤銷') || title.includes('撤案')) {
        status = '已撤案';
    }
    if (title.includes('決標')) {
        status = '已決標';
    }

    // 2. ROC Date Parser
    function parseRocDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const cleanStr = dateStr.replace(/\\/g, '').trim();

        if (cleanStr.match(/^\d{4}-\d{2}-\d{2}/)) return cleanStr;

        const rocMatch = cleanStr.match(/^(\d{2,3})[\/\.](\d{1,2})[\/\.](\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/);
        if (rocMatch) {
            const rocYear = parseInt(rocMatch[1]);
            const month = rocMatch[2].padStart(2, '0');
            const day = rocMatch[3].padStart(2, '0');
            let timePart = '00:00:00';
            if (rocMatch[4]) timePart = rocMatch[4] + ':00';

            const adYear = rocYear + 1911;
            return `${adYear}-${month}-${day}T${timePart}+08:00`;
        }
        return null;
    }

    // 3. IMPROVED Deadline Extraction
    let deadlineStr = originalItem.end_date;

    if (!deadlineStr && html) {
        // ✅ 擴充關鍵字（中英文）
        const keywords = [
            'DEADLINE', 'deadline', 'Deadline',
            '截止投標', '截止', '投標截止', '收件截止',
            '截止時間', '截止日期', '投標期限', '收件期限',
            '投標文件收件截止'
        ];

        let bestDate = null;
        let minDistance = Infinity;

        // ✅ 改進的日期正則（支援更多格式）
        const dateRegex = /(\d{2,3})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/g;

        const dates = [];
        let match;
        while ((match = dateRegex.exec(html)) !== null) {
            dates.push({
                full: match[0],
                index: match.index
            });
        }

        // ✅ 對每個關鍵字搜尋
        for (const kw of keywords) {
            const kwRegex = new RegExp(kw, 'gi');
            let kwMatch;
            while ((kwMatch = kwRegex.exec(html)) !== null) {
                const kwIndex = kwMatch.index;

                // ✅ 雙向搜尋：向前 1000、向後 5000 字符
                for (const date of dates) {
                    const distance = date.index - kwIndex;
                    const absDistance = Math.abs(distance);

                    // 接受關鍵字前後的日期
                    if (distance > -1000 && distance < 5000 && absDistance < minDistance) {
                       minDistance = absDistance;
                       bestDate = date.full;
                    }
                }
            }
        }

        if (bestDate) {
            deadlineStr = bestDate;
        } else {
            // ✅ 備用方案：如果沒找到，記錄 debug 資訊
            console.log('⚠️ No deadline found for:', title);
            console.log('  HTML length:', html.length);
            console.log('  Dates found:', dates.length);
        }
    }

    const parsedDeadline = parseRocDate(deadlineStr);

    // ✅ Debug 輸出
    if (!parsedDeadline) {
        console.log('❌ Failed to parse deadline for:', title);
        console.log('  Raw deadline string:', deadlineStr);
    }

    return {
        json: {
            title: title,
            url: 'https://acebidx.com' + originalItem.url,
            source: 'AceBidX',
            org_name: originalItem.org_name,
            keyword_tag: $('Prepare Loop').item.json.keyword,
            publish_date: parseRocDate(originalItem.post_date),
            deadline_date: parsedDeadline,
            status: status
        }
    };
});
```

#### **步驟 2：儲存並測試**

1. 點擊 "Save"
2. 點擊 "Execute Workflow" 手動測試
3. 查看執行結果
4. 確認新標案是否有 deadline_date

---

## 🧪 測試方法

### **測試 1：手動執行工作流**

1. 在 n8n 中手動執行
2. 檢查 "Process Dates" 節點的輸出
3. 確認 `deadline_date` 欄位是否有值

### **測試 2：檢查資料庫**

```bash
cd "/Users/chiuyongren/Desktop/AI dev"
node check-tender-status.js
```

應該會看到：
```
沒有截止日期: < 200 筆（下降）
```

### **測試 3：檢查特定標案**

```bash
node check-specific-tender.js
```

檢查「彰化縣永靖鄉衛生所」是否有 deadline_date。

---

## 📊 預期效果

### **修改前**
```
有 deadline_date：78 筆（22.5%）
無 deadline_date：268 筆（77.5%）❌
```

### **修改後（預期）**
```
有 deadline_date：200-250 筆（58-72%）✅
無 deadline_date：96-146 筆（28-42%）
```

**改善**：增加 120-170 筆標案的 deadline_date

---

## 🚀 進階方案（如果基本修改效果不佳）

### **方案 1：檢查 AceBidX API**

打開瀏覽器 DevTools：

1. 前往 https://acebidx.com
2. 開啟 Network 標籤
3. 搜尋標案
4. 查看 API 請求

**尋找**：
- 是否有 `/api/tender/[id]` 端點
- 回傳的 JSON 是否包含 deadline

如果有：
- 在 n8n 中添加一個 HTTP Request 節點
- 調用詳細 API
- 直接獲取結構化資料

---

### **方案 2：使用 Puppeteer**

如果 HTML 解析仍然不可靠：

1. 安裝 n8n Puppeteer 節點
2. 用瀏覽器自動化抓取頁面
3. 等待 JavaScript 載入完成
4. 提取完整 DOM

**優點**：最可靠
**缺點**：較慢、資源消耗大

---

## ⚠️ 注意事項

### **1. 執行頻率**

目前工作流每分鐘執行一次：

```json
"rule": {
    "interval": [{"field": "minutes", "minutesInterval": 1}]
}
```

**建議**：
- 如果抓取量大，改為每 5-10 分鐘
- 或改為每小時特定時間

### **2. Cookie 過期**

HTTP Request 節點使用固定的 Cookie：

```
Cookie: ot_session=eyJ...
```

**問題**：Cookie 會過期
**解決**：定期更新 Cookie

### **3. Rate Limiting**

AceBidX 可能有請求頻率限制。

**建議**：
- 在 HTTP Request 節點中添加延遲
- 或使用批次處理

---

## 📝 檢查清單

- [ ] 修改 "Process Dates" 節點代碼
- [ ] 儲存工作流
- [ ] 手動執行測試
- [ ] 檢查執行日誌（Console.log 輸出）
- [ ] 查詢資料庫驗證結果
- [ ] 執行 `check-tender-status.js` 確認改善
- [ ] 如果效果不佳，考慮進階方案

---

## 🎯 下一步

1. **立即修改工作流**（30 分鐘）
2. **測試驗證**（15 分鐘）
3. **如果效果好**：
   - 等待新標案自動抓取
   - 監控 deadline_date 比例
4. **如果效果不佳**：
   - 檢查 AceBidX API
   - 考慮使用 Puppeteer

需要我協助哪一步？
