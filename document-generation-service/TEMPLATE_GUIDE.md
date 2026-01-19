# Word 範本製作完整指南

## 📋 目錄
1. [基本概念](#基本概念)
2. [變數語法](#變數語法)
3. [表格循環](#表格循環)
4. [條件判斷](#條件判斷)
5. [進階技巧](#進階技巧)
6. [實戰範例](#實戰範例)

---

## 基本概念

### Jinja2 模板引擎
本服務使用 **Jinja2** 模板語法,這是 Python 生態系最流行的模板引擎。

### 三種標籤類型
1. **變數標籤**: `{{ variable }}`
2. **邏輯標籤**: `{% if %} {% for %}`
3. **註解標籤**: `{# 這是註解 #}`

---

## 變數語法

### 1. 簡單變數
```
客戶名稱: {{ customer_name }}
專案編號: {{ project_id }}
聯絡人: {{ contact_person }}
```

### 2. 巢狀物件
```json
{
  "company": {
    "name": "台灣科技",
    "address": "台北市信義區"
  }
}
```

在 Word 中:
```
公司名稱: {{ company.name }}
公司地址: {{ company.address }}
```

### 3. 陣列索引
```json
{
  "team_members": ["張三", "李四", "王五"]
}
```

在 Word 中:
```
專案經理: {{ team_members[0] }}
技術主管: {{ team_members[1] }}
```

---

## 表格循環

### 基本表格循環

**JSON 數據**:
```json
{
  "items": [
    {"name": "系統開發", "quantity": 1, "price": 500000},
    {"name": "維護服務", "quantity": 12, "price": 50000}
  ]
}
```

**Word 表格** (選取整列插入標籤):

| 項目名稱 | 數量 | 單價 |
|---------|------|------|
| {% tr for item in items %}{{ item.name }} | {{ item.quantity }} | {{ item.price }}{% endtr %} |

**重要**: 
- 使用 `{% tr %}` 和 `{% endtr %}` 包住整列
- 系統會自動複製該列

### 帶計算的表格

| 項目名稱 | 數量 | 單價 | 小計 |
|---------|------|------|------|
| {% tr for item in items %}{{ item.name }} | {{ item.quantity }} | {{ item.price }} | {{ item.quantity * item.price }}{% endtr %} |

---

## 條件判斷

### 1. 簡單條件
```
{% if score >= 60 %}
評等: 及格
{% else %}
評等: 不及格
{% endif %}
```

### 2. 多重條件
```
{% if score >= 90 %}
評等: 優秀
{% elif score >= 70 %}
評等: 良好
{% elif score >= 60 %}
評等: 及格
{% else %}
評等: 不及格
{% endif %}
```

### 3. 條件顯示段落
```
{% if include_warranty %}
保固條款:
本專案提供一年免費保固服務...
{% endif %}
```

---

## 進階技巧

### 1. 過濾器 (Filters)

#### 格式化數字
```
金額: {{ total_amount | format_number }}
```

#### 日期格式化
```
今日日期: {{ today | strftime('%Y年%m月%d日') }}
```

#### 大小寫轉換
```
公司名稱: {{ company_name | upper }}
```

### 2. 自定義過濾器

在 `service.py` 中新增:
```python
from docxtpl import DocxTemplate

def format_currency(value):
    return f"NT$ {value:,}"

# 註冊過濾器
doc = DocxTemplate(template_path)
doc.render(context, jinja_env={'filters': {'currency': format_currency}})
```

在 Word 中使用:
```
總金額: {{ total_amount | currency }}
```

### 3. 圖片插入

**JSON 數據**:
```json
{
  "company_logo": "/path/to/logo.png"
}
```

**Word 中**:
```
{{ company_logo | image }}
```

或指定尺寸:
```python
from docxtpl import InlineImage
from docx.shared import Mm

context = {
    'logo': InlineImage(doc, 'logo.png', width=Mm(50))
}
```

---

## 實戰範例

### 範例 1: RFP 回應書

**JSON 數據**:
```json
{
  "rfp_id": "RFP-2025-001",
  "company_name": "台灣科技股份有限公司",
  "project_name": "智慧城市管理系統",
  "total_budget": 5000000,
  "team": [
    {"name": "張三", "role": "專案經理", "experience": 10},
    {"name": "李四", "role": "技術主管", "experience": 8}
  ],
  "milestones": [
    {"phase": "需求分析", "duration": 2, "deliverable": "需求規格書"},
    {"phase": "系統開發", "duration": 6, "deliverable": "系統原型"}
  ]
}
```

**Word 範本**:

```
標案編號: {{ rfp_id }}
投標廠商: {{ company_name }}
專案名稱: {{ project_name }}
總預算: NT$ {{ total_budget | format_number }}

一、團隊組成

{% tr for member in team %}
{{ member.name }} | {{ member.role }} | {{ member.experience }} 年經驗
{% endtr %}

二、專案時程

{% tr for milestone in milestones %}
{{ milestone.phase }} | {{ milestone.duration }} 個月 | {{ milestone.deliverable }}
{% endtr %}

三、預算說明

{% if total_budget > 3000000 %}
本專案屬於大型專案,將採用敏捷開發方法...
{% else %}
本專案屬於中小型專案,將採用瀑布式開發...
{% endif %}
```

---

## 🎯 最佳實踐

### 1. 範本設計原則
- ✅ 先在 Word 中設計好完整樣式
- ✅ 使用「樣式」功能統一格式
- ✅ 表格使用「表格樣式」
- ✅ 標題使用「標題 1/2/3」

### 2. 數據結構設計
- ✅ 使用清晰的鍵名 (customer_name 而非 cn)
- ✅ 數字類型用 Number,不要用 String
- ✅ 日期使用 ISO 8601 格式

### 3. 測試流程
1. 先用簡單數據測試
2. 逐步增加複雜度
3. 測試邊界情況 (空陣列、null 值)

---

## ⚠️ 常見錯誤

### 錯誤 1: 表格標籤位置錯誤
❌ **錯誤**:
```
{% for item in items %}
| {{ item.name }} | {{ item.price }} |
{% endfor %}
```

✅ **正確**:
```
{% tr for item in items %}
{{ item.name }} | {{ item.price }}
{% endtr %}
```

### 錯誤 2: 變數名稱不一致
❌ **錯誤**:
```json
{"customerName": "台灣科技"}  // camelCase
```
```
{{ customer_name }}  // snake_case
```

✅ **正確**: 統一使用 snake_case

### 錯誤 3: 忘記處理 null 值
❌ **錯誤**:
```
{{ company.address }}  // 如果 address 不存在會報錯
```

✅ **正確**:
```
{{ company.address | default('未提供') }}
```

---

## 📚 參考資源

- [Jinja2 官方文檔](https://jinja.palletsprojects.com/)
- [python-docx-template GitHub](https://github.com/elapouya/python-docx-template)
- [Word 樣式設計指南](https://support.microsoft.com/zh-tw/office/word-styles)

