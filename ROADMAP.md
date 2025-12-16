# AI 標案助手系統 - 開發路線圖

> **最後更新**: 2025-12-15  
> **專案目標**: 打造一套「可追溯、可控、可擴充」的 AI 標案撰寫系統

---

## 📋 系統概述

本系統不是「叫 GPT 幫我寫標案」而已，而是一套：
- 以 **評分構面** 為核心
- 以 **專案知識庫** 為基礎
- 支援多來源（Drive / 本地 / 爬蟲）
- 由使用者掌控外部資料匯入的 **AI 標案撰寫與知識管理平台**

---

## 🏗️ 技術架構

| 層級 | 技術選擇 |
|------|----------|
| Frontend | Next.js 16 + React + Tailwind CSS |
| Backend API | Next.js API Routes + Supabase |
| Database | PostgreSQL + pgvector (Supabase) |
| Workflow | n8n (Self-hosted) |
| AI/LLM | Google Gemini API |
| Storage | Supabase Storage |

---

## ✅ Phase 1 (MVP) - 已完成

| 功能 | 狀態 | 說明 |
|------|:----:|------|
| 專案管理（Projects） | ✅ | 建立/查看/刪除專案 |
| 使用者認證 | ✅ | Supabase Auth |
| Tender 上傳 | ✅ | 支援 PDF / DOCX 上傳至 Supabase Storage |
| 文件解析 (WF01) | ✅ | n8n workflow: 提取文字內容 |
| Criteria 解析 (WF02) | ✅ | Gemini 自動提取評分構面 |
| Section 建議 (WF02) | ✅ | Gemini 自動建議章節大綱 |
| 專案狀態流程 | ✅ | draft → processing → active |
| 章節列表顯示 | ✅ | 前端顯示 AI 生成的章節 |

---

## ✅ Phase 1 (MVP) - 全部完成！

| 功能 | 狀態 | 說明 |
|------|:----:|------|
| 內部知識庫 (Internal KB) | ✅ | 上傳公司文件 → 切 chunk → embedding |
| Chunks 表 + Embedding | ✅ | pgvector 語意檢索基礎建設 (WF07) |
| RAG 查詢 API | ✅ | WF08 Webhook → Vector Search → Gemini |
| Project KB 關聯 | ✅ | `project_sources` 表 + `match_chunks_by_project()` 函數 |
| 前端 KB 管理 UI | ✅ | SourceManager 組件 - 勾選 sources 加入專案 |
| RAG 章節草稿生成 | ✅ | `/api/rag/generate` → WF08 → 儲存到 `content_draft` |
| 草稿編輯器 | ✅ | TipTap 富文本編輯器 + 儲存功能 |

---

## ❌ Phase 2 - 外部搜尋與候選機制

| 功能 | 狀態 | 說明 |
|------|:----:|------|
| External Search Agent | ❌ | 搜尋政府網站、政策文件 |
| 外部候選資料列表 UI | ❌ | 顯示搜尋結果供使用者選擇 |
| 使用者勾選匯入 Project KB | ❌ | 外部資料需經使用者同意才加入 |
| Citations 來源顯示 | ❌ | 每段內容顯示引用來源 |
| WebCrawler Connector | ❌ | 定期爬取指定網站內容 |

---

## ❌ Phase 3 - NotebookLM 式完整體驗

| 功能 | 狀態 | 說明 |
|------|:----:|------|
| Google Drive Connector | ❌ | OAuth 連接 Google Drive |
| 段落/句子級 AI 重寫 | ❌ | 選取文字 → AI 重寫/延伸/壓縮 |
| 來源追溯 UI | ❌ | 側邊欄顯示各段落引用來源 |
| 多使用者協作 | ❌ | 團隊共同編輯標案 |
| 匯出功能 | ❌ | 匯出 Word / PDF |

---

## 📊 資料模型

### 已建立的表

```sql
-- 專案
projects (id, title, status, created_at, user_id)

-- 知識來源
sources (id, project_id, type, title, content, origin_url, created_at)

-- 評分構面
criteria (id, project_id, group_name, title, weight, description)

-- 章節大綱
sections (id, project_id, parent_id, title, content_draft, order_index)

-- 任務/需求項目
tasks (id, project_id, section_id, requirement_text, response_draft, status)

-- 知識片段 (需完善)
chunks (id, source_id, text, embedding, metadata)
```

### 待建立的表

```sql
-- 專案知識庫關聯
project_kb (
  project_id UUID,
  source_id UUID,
  PRIMARY KEY (project_id, source_id)
)

-- 草稿版本歷史
draft_versions (
  id UUID,
  section_id UUID,
  content TEXT,
  citations JSONB,
  created_at TIMESTAMP
)
```

---

## 🔄 n8n Workflows

| Workflow | ID | 狀態 | 說明 |
|----------|-----|:----:|------|
| WF01-Document-Ingestion | NQhcAMLCh8RogDfh | ✅ | 文件上傳 → 文字提取 → 觸發 WF02 |
| WF02-Criteria-Parsing | KpW4SKD0a0VGtruf | ✅ | 評分構面提取 + 章節建議 + 狀態更新 |
| WF07-Embedding-Gemini | AxIETKBv40B9ZiL5 | ✅ | Sources → Chunk → Gemini Embedding → pgvector |
| WF08-RAG-Query-Gemini | - | ✅ | Webhook → Embed Query → Vector Search → Gemini 回答 |
| WF03-RAG-Generation | - | ❌ | RAG 章節內容生成 |
| WF04-External-Search | - | ❌ | 外部資料搜尋 |

---

## 🎯 下一步開發建議

### 優先順序 1: 內部知識庫 + RAG 系統

這是系統的**核心價值**，讓 AI 生成的內容有依據可追溯。

```
使用者上傳公司文件 
    → 切 Chunk (段落/句子)
    → Embedding (text-embedding-3-large)
    → 存入 pgvector
                ↓
章節生成時 → RAG 檢索相關 chunks → 餵給 LLM → 生成有依據的內容
```

### 優先順序 2: Project KB 管理 UI

- 讓使用者選擇哪些 sources 加入此專案
- 前端：勾選式 source 列表
- 確保 LLM 只能使用被選中的知識

### 優先順序 3: 草稿編輯器

- 整合 TipTap 富文本編輯器
- 支援儲存到 `sections.content_draft`
- 支援 Markdown 格式

### 優先順序 4: Citations 追溯

- 每段生成內容附上 `chunk_id` 來源
- UI 顯示引用來源（hover 或側邊欄）

---

## 📝 設計原則

1. **章節不是固定模板，評分構面才是核心**
   - 內部邏輯以「criteria」產生內容
   - 「章節」只是排版與包裝

2. **三類知識來源**
   - 標案來源 (Tender Source)
   - 內部知識庫 (Internal KB)
   - 外部知識 (External KB)

3. **專案知識庫 (Project KB)**
   - 每個專案有自己的可用知識池
   - LLM 只能使用 Project KB 的內容
   - 外部資料需使用者勾選才加入

4. **NotebookLM 式互動**
   - 使用者先決定用哪些資料
   - LLM 只根據這些資料生成
   - 不足時可搜尋外部 → 勾選匯入

---

## 📚 參考文件

- [系統設計說明書](./docs/SYSTEM_DESIGN.md) *(待建立)*
- [API 規格文件](./docs/API_SPEC.md) *(待建立)*
- [前端 UI 設計](./docs/UI_DESIGN.md) *(待建立)*

---

*此文件由開發團隊維護，請隨開發進度更新。*

