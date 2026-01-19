# 目錄頁判定修復說明

## 問題描述

### 問題 1：真實目錄頁未被檢測到

**案例**：
```
page: 2
content: ## 目 錄

| | 計畫概述 ... |
|---|---|
| 參、 | ... 1 |

is_toc_candidate: false  ❌ 錯誤！
```

**原因**：
- 目錄內容被 Docling 當作**表格**處理
- `page_items_map` 只收集 `doc.texts`，不包含 `doc.tables`
- 檢測時 `page_raw_text` 是空的，無法匹配「目錄」關鍵字

### 問題 2：一般內容頁被誤判為目錄

**案例**：
```
拾、廠商企業社會責任
拾壹、附件

is_toc_candidate: true  ❌ 錯誤！
```

**原因**：
- 關鍵字列表包含「壹、貳、參、肆」等章節編號
- 一般內容頁也會包含這些章節編號
- 導致誤判

---

## 修復方案

### 修復 1：使用包含表格文字的檢測源

**修改位置**：`parsing-service/main.py` 第 443-465 行

**修改前**：
```python
# 只檢查 doc.texts
page_text_items = page_items_map.get(pno, [])
page_raw_text = "\n".join([t.text for t in page_text_items])
```

**修改後**：
```python
# 使用 page_text_for_detection（包含 doc.texts + doc.tables 的文字）
page_raw_text = "\n".join(page_text_for_detection.get(pno, []))
```

**效果**：
- ✅ 目錄表格的文字內容會被包含在檢測中
- ✅ 可以正確匹配「目錄」、「目 錄」等關鍵字

### 修復 2：精簡關鍵字列表

**修改前**：
```python
toc_keywords = [
    "目錄", "目 錄",
    "Table of Contents", "TABLE OF CONTENTS",
    "INDEX", "Index", "CONTENTS", "Contents",
    "壹、", "貳、", "參、", "肆、",  # ❌ 會導致誤判
]
```

**修改後**：
```python
toc_keywords = [
    "目錄", "目 錄",  # 中文（含空格）
    "Table of Contents", "TABLE OF CONTENTS",  # 英文
    "INDEX", "Index",  # 索引
]
```

**效果**：
- ✅ 只檢測明確的目錄標題
- ✅ 避免誤判包含章節編號的一般內容頁

### 修復 3：增強調試輸出

**新增**：
```python
print(f"DEBUG: Page {pno} matched TOC keyword: '{keyword}'")
print(f"DEBUG: Page {pno} Text Snippet: {page_raw_text[:150]}...")
```

**效果**：
- ✅ 可以看到匹配的關鍵字
- ✅ 可以看到頁面文字預覽
- ✅ 方便調試和驗證

---

## 測試結果

### 測試 1：真實目錄頁（帶空格）✅

**輸入**：
```
## 目 錄

| | 計畫概述 ... |
```

**結果**：
```
is_toc_candidate: true  ✅
matched keyword: '目 錄'
```

### 測試 2：誤判案例（章節編號）✅

**輸入**：
```
拾、廠商企業社會責任
拾壹、附件
```

**結果**：
```
is_toc_candidate: false  ✅
（不再誤判）
```

### 測試 3：英文目錄 ✅

**輸入**：
```
Table of Contents

Chapter 1: Introduction ... 1
```

**結果**：
```
is_toc_candidate: true  ✅
matched keyword: 'Table of Contents'
```

### 測試 4：一般內容頁 ✅

**輸入**：
```
## 三、 建議書裝訂

( 一 ) 建議書請以 A4 ...
```

**結果**：
```
is_toc_candidate: false  ✅
```

---

## 使用方式

1. **重啟 parsing-service**：
```bash
cd parsing-service
# 如果使用 Docker
docker-compose restart parsing-service

# 或直接運行
uvicorn main:app --reload --port 8000
```

2. **查看調試日誌**：
```
DEBUG: Page 2 matched TOC keyword: '目 錄'
DEBUG: Page 2 is_toc_candidate: true
DEBUG: Page 2 Text Snippet: ## 目 錄

| | 計畫概述 ...
```

3. **驗證結果**：
- 真實目錄頁：`is_toc_candidate: true`
- 一般內容頁：`is_toc_candidate: false`

---

## 相關文件

- `page_text_for_detection` 的建立：第 358-375 行
- 目錄檢測邏輯：第 443-465 行
- 表格轉文字處理：第 394-418 行

