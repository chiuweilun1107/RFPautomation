# PaddleOCR "TEST" 返回 15 個結果問題 - 修復報告

## 問題摘要

**原始問題**: 使用 PaddleOCR 3.x 處理簡單的 "TEST" 文字圖片時，返回 15 個 OCR 結果，而非預期的 1 個。

**修復狀態**: ✅ **已修復**

---

## 根本原因

### PaddleOCR 3.x API 結構變化

PaddleOCR 3.x 的 API 發生了重大變化：

**舊版 (2.x)**:
```python
result = ocr.ocr(image)
# result[0] 是列表: [[[x1,y1],...], (text, confidence)]
for line in result[0]:
    bbox = line[0]
    text, conf = line[1]
```

**新版 (3.x)**:
```python
result = ocr.predict(image)  # 使用 predict 而非 ocr
# result[0] 是 OCRResult 對象
json_data = result[0].json
res = json_data['res']
rec_texts = res['rec_texts']  # 文字列表
rec_scores = res['rec_scores']  # 信心度列表
dt_polys = res['dt_polys']  # 多邊形坐標
```

### 錯誤的代碼行為

原代碼嘗試迭代 `OCRResult` 對象：

```python
for line in result[0]:  # ❌ 錯誤
```

這導致迭代 `OCRResult` 的 15 個內部屬性鍵值：
- `input_path`
- `page_index`
- `doc_preprocessor_res`
- `dt_polys`
- `text_det_params`
- `text_type`
- `textline_orientation_angles`
- `text_rec_score_thresh`
- `return_word_box`
- `rec_texts`
- `rec_scores`
- `rec_polys`
- `rec_boxes`
- `model_settings`
- ...

因此返回 **15 個結果** 而非 **1 個文字檢測結果**。

---

## 診斷過程

### 1. 創建診斷腳本

`diagnose_15_results.py` 用於分析 PaddleOCR 返回結構：

```python
result = ocr.predict(image)
page_result = result[0]

# 發現 OCRResult 對象有 .json 屬性
json_data = page_result.json
res = json_data['res']

# 正確的數據在這裡:
rec_texts = res['rec_texts']  # ['TEST']
rec_scores = res['rec_scores']  # [0.999]
dt_polys = res['dt_polys']  # [[[0,2], [116,2], [116,47], [0,47]]]
```

**診斷結果**:
- OCR 實際正常工作，檢測到 1 個文字區域
- 問題在於代碼錯誤地解析結果

### 2. 測試三個假設

| 假設 | 結果 |
|------|------|
| A. 顏色問題 (黑底白字) | ❌ 不是原因，白底黑字也返回 15 個 |
| B. API 結構變化 | ✅ **確認為根本原因** |
| C. Document Understanding 干擾 | ❌ 不是原因，模型正常工作 |

---

## 修復方案

### 修改文件: `main.py` (Line 81-180)

**關鍵變化**:

1. **使用新 API**:
   ```python
   # 舊: result = ocr.ocr(image)
   # 新:
   result = ocr.predict(image)
   ```

2. **檢測 OCRResult 對象**:
   ```python
   page_result = result[0]

   if hasattr(page_result, 'json'):
       # PaddleOCR 3.x
       json_data = page_result.json
       res = json_data['res']

       rec_texts = res.get('rec_texts', [])
       rec_scores = res.get('rec_scores', [])
       dt_polys = res.get('dt_polys', [])

       for text, score, poly in zip(rec_texts, rec_scores, dt_polys):
           # 處理每個檢測結果
   ```

3. **向後兼容 2.x**:
   ```python
   elif isinstance(page_result, list):
       # PaddleOCR 2.x
       for line in page_result:
           bbox_points = line[0]
           text, confidence = line[1]
   ```

---

## 測試結果

### 測試 1: 黑底白字 "TEST"
```
✅ 成功
   檢測到 1 個文字框
   [0] 'TEST' (信心度: 0.999)
       Bbox: [2, 0, 47, 116]
```

### 測試 2: 白底黑字 "TEST"
```
✅ 成功
   檢測到 1 個文字框
   [0] 'TEST' (信心度: 0.998)
       Bbox: [11, 0, 51, 111]
```

### 測試 3: 原始測試案例
```
✅ 結果:
   偵測到: 1 個
   文字: 'TEST'
```

**所有測試通過！** 🎉

---

## 已知問題

### ⚠️ 坐標系統仍不正確

雖然檢測數量正確 (1 個結果)，但坐標轉換仍有問題：

- **預期**: X≈10-190, Y≈10-40
- **實際**: X≈80-93, Y≈5-32

這是 **獨立的坐標轉換問題**，與 "15 個結果" 無關。

---

## 文件清單

| 文件 | 狀態 | 說明 |
|------|------|------|
| `main.py` | ✅ 已修復 | 主服務文件，已更新為 3.x API |
| `diagnose_15_results.py` | ✅ 新增 | 診斷腳本 |
| `test_fix.py` | ✅ 新增 | 驗證腳本 |
| `FIX_SUMMARY.md` | ✅ 新增 | 本報告 |

---

## 回滾計劃

如果需要回滾 (不建議):

```bash
cd paddleocr-service
git checkout main.py  # 恢復原始文件
pkill -f "python main.py"
python main.py &
```

---

## 後續建議

1. ✅ **已完成**: 修復 "15 個結果" 問題
2. ⚠️ **待處理**: 修復坐標轉換問題
3. 💡 **可選**: 升級到最新 PaddleOCR 版本
4. 💡 **可選**: 添加單元測試

---

## 技術細節

### PaddleOCR 3.x 完整結構

```json
{
  "res": {
    "input_path": null,
    "page_index": null,
    "model_settings": {
      "use_doc_preprocessor": true,
      "use_textline_orientation": true
    },
    "dt_polys": [
      [[0, 2], [116, 2], [116, 47], [0, 47]]
    ],
    "rec_texts": ["TEST"],
    "rec_scores": [0.999],
    "rec_polys": [
      [[0, 2], [116, 2], [116, 47], [0, 47]]
    ],
    "rec_boxes": [
      [0, 2, 116, 47]
    ]
  }
}
```

### 使用的模型

- `PP-OCRv5_server_det`: 文字檢測
- `PP-OCRv5_server_rec`: 文字識別
- `UVDoc`: 文檔理解
- `PP-LCNet_x1_0_doc_ori`: 文檔方向
- `PP-LCNet_x1_0_textline_ori`: 文字行方向

---

**修復日期**: 2026-01-17
**修復者**: Claude
**驗證狀態**: ✅ 通過所有測試
