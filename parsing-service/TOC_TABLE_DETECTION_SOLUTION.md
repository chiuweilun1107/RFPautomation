# 目錄被誤判為表格的解決方案

## 問題描述

Docling 的 Layout Model 經常將 PDF 中的目錄（Table of Contents）誤判為表格（Table），原因是：

1. **視覺相似性**：目錄的結構（條目 + 點線 + 頁碼）在視覺上與表格非常相似
2. **內容缺失**：一旦被判為表格，文字內容就被結構化了，無法直接提取為純文字
3. **後處理困難**：如果在後處理階段才過濾，會導致目錄的文字內容完全缺失

## 解決方案

### 核心思路

**在 Docling 處理階段就介入**，檢測被誤判為表格的目錄，並提取其文字內容。

### 實作步驟

#### 1. 智能檢測函數 `is_table_actually_toc()`

位置：`parsing-service/main.py` 第 120-182 行

```python
def is_table_actually_toc(table_data: List[List[str]], page_text: str = "") -> bool:
    """
    檢測表格是否實際上是目錄
    
    判斷依據：
    1. 表格內容包含目錄關鍵字（壹、貳、參、一、二、三）
    2. 最後一列通常是頁碼（純數字）
    3. 行數較多（目錄通常有多個條目）
    4. 頁面文字包含「目錄」、「Table of Contents」等關鍵字
    """
```

**檢測模式**：
- 中文數字章節：`壹、貳、參、肆、伍...`
- 一般數字章節：`一、二、三、四、五...`
- 數字編號：`1.1、1.2、2.1...`
- 章節標記：`第一章、第二章...`
- 英文章節：`Chapter 1、Chapter 2...`
- 括號編號：`(一)、(二)、(三)...`

**判斷邏輯**：
```python
# 1. 如果頁面有目錄關鍵字 + 表格有 30% 以上的目錄指標 → 是目錄
if has_toc_keyword and toc_ratio > 0.3:
    return True

# 2. 如果表格有 50% 以上的目錄指標 → 是目錄
if toc_ratio > 0.5:
    return True
```

#### 2. 收集表格文字內容

位置：`parsing-service/main.py` 第 358-375 行

```python
# 同時收集表格的文字內容（目錄可能被誤判為表格）
for tb in doc.tables:
    if tb.prov:
        p_no = tb.prov[0].page_no
        if p_no in page_text_for_detection:
            try:
                # 從表格中提取所有文字
                df = tb.export_to_dataframe(doc)
                table_text = " ".join(df.fillna("").astype(str).values.flatten())
                page_text_for_detection[p_no].append(table_text)
            except:
                pass
```

**目的**：確保目錄關鍵字檢測能夠涵蓋表格中的內容。

#### 3. 表格處理邏輯

位置：`parsing-service/main.py` 第 394-418 行

```python
elif kind == 'table':
    # 檢查表格是否實際上是目錄
    try:
        df = item.export_to_dataframe(doc)
        table_data = df.fillna("").astype(str).values.tolist()
        page_text = "\n".join(page_text_for_detection.get(p_no, []))
        
        if is_table_actually_toc(table_data, page_text):
            # 將表格轉換為文字列表（目錄格式）
            print(f"[TOC Detection] Converting table to text format on page {p_no}")
            
            # 提取表格的所有文字內容，保持行的結構
            for row in table_data:
                row_text = " ".join([str(cell).strip() for cell in row if str(cell).strip()])
                if row_text:
                    page_contents[p_no].append(row_text)
            
            # 不添加表格圖片（因為這是目錄，不需要圖片）
        else:
            # 正常的表格處理
            page_contents[p_no].append(item.export_to_markdown())
            url = table_image_urls.get(id(item))
            if url: page_images_map[p_no].append(url)
    except Exception as table_err:
        print(f"Error processing table on page {p_no}: {table_err}")
        # Fallback: 使用原始 Markdown
        page_contents[p_no].append(item.export_to_markdown())
```

**處理流程**：
1. 檢測表格是否為目錄
2. **如果是目錄**：提取文字內容，逐行添加到頁面內容
3. **如果是表格**：使用原始的 Markdown 表格格式

## 優勢

✅ **內容不缺失**：從表格中提取文字，確保目錄內容完整保留  
✅ **在處理階段介入**：不是後處理過濾，而是在 Docling 處理時就轉換  
✅ **智能檢測**：支援多種目錄格式（中文、英文、數字編號）  
✅ **容錯機制**：如果檢測失敗，仍然保留原始表格格式  

## 測試

運行測試腳本：

```bash
cd parsing-service
python test_toc_detection.py
```

測試案例包括：
1. 典型的中文目錄（壹、貳、參）
2. 一般數據表格（不是目錄）
3. 英文目錄（Chapter 1, 2, 3）
4. 混合格式目錄（一、二、三 + (一)、(二)）

## 配合 n8n 工作流

這個解決方案與現有的 WF01-Document-Ingestion-Hybrid 工作流完全兼容：

1. **Parsing Service** 會自動檢測並轉換目錄表格
2. **頁面內容** 包含完整的目錄文字
3. **Llava TOC Repair** 仍然可以進一步優化目錄結構

## 日誌輸出

當檢測到目錄表格時，會輸出：

```
[TOC Detection] Table identified as TOC (keyword + 45.2% indicators)
[TOC Detection] Converting table to text format on page 2
```

## 未來改進

如果需要更精確的控制，可以考慮：

1. **調整檢測閾值**：修改 `toc_ratio > 0.3` 和 `toc_ratio > 0.5` 的值
2. **添加更多模式**：在 `toc_patterns` 中添加更多章節格式
3. **使用 AI 輔助**：對於模糊案例，可以調用 Gemini 或 Llava 進行二次確認

