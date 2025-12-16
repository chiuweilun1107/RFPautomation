# AI 標案助手系統設計說明書 (System Design Document)
（RFP / 需求服務建議書自動化＋專案知識庫）

---

## 1. 背景與目標

### 1.1 問題背景（以台灣標案為主）
*   **常見標案文件類型**：需求服務建議書、實施計畫書、系統建置規劃書、各種企劃書＋評選構面表。
*   **常見痛點**：
    *   每一案的章節結構不同，沒有固定模板。
    *   每份標案都有自己的評選構面與配分，要一一對應。
    *   團隊有很多「舊標案、產品簡介、系統文件」，但人工重複拼接耗時。
*   **現有 AI 工具侷限**：直接用 GPT 生文件常胡亂編造（幻覺）、無法追溯來源、難以控管內容。

### 1.2 本系統目標
打造一套「可追溯、可控、可擴充」的 AI 標案撰寫系統：
*   **支援台灣標案結構**：自由章節結構，不套死模板。
*   **評分構面核心 (Criteria-Centric)**：內部邏輯以「評分項目」為中心產生內容。
*   **混合知識庫 (Hybrid KB)**：結合 內部＋外部知識，但由使用者決定引用範圍。
*   **可追溯 (Traceable)**：每一段文字都可以追溯來源（內部檔案 / 外部網站 / 標案原文）。
*   **NotebookLM 式流程**：選知識來源 → 自動生成 → 使用者審閱 → 可重寫/補充/加外部資料。

---

## 2. 核心設計理念

### 2.1 章節不是固定模板，評分構面才是核心
*   **動態章節**：因為每個標案章節要求不同（如原民文化融入、資安要求），系統不應預設固定目錄。
*   **構面導向**：內部模型以「criteria（評分項目）」產生內容，外層將 content 組裝成「章節」。

### 2.2 三類知識來源 ＋ 專案知識庫（Project KB）
系統中所有文字來源分為三類：

1.  **標案來源（Tender Source）**
    *   來源：標案 PDF/Word、需求說明書、評選構面。
    *   功能：決定要有哪些章節、作為評分對照檢查依據。

2.  **內部知識庫（Internal KB）**
    *   來源：產品文件、技術文件、過去標案、SOP。
    *   功能：寫出「本公司方案與能力」的主體內容。

3.  **外部知識（External KB）**
    *   來源：政府政策、統計報告、白皮書。
    *   功能：撐論述、提背景。需經使用者勾選才進入專案。

### 2.3 專案知識庫（Project KB）
每個標案專案有自己的「可用知識池」，由以下組成：
*   使用者勾選的 **Internal sources subset**。
*   使用者同意匯入的 **External sources**。
*   **Tender chunks**。
*   **規則**：預設只能使用 Project KB 內容，不得自行聯網瞎掰。

### 2.4 NotebookLM 式互動流程
*   使用者決定 Knowledge Sources。
*   LLM 僅根據這些資料生成。
*   若內容不足 → 使用者啟動「外部搜尋」→ 勾選匯入 → 成為 Project KB 一部分 → 重寫。

---

## 3. 整體系統架構概觀

### 3.1 高階架構
*   **Frontend (Web App)**: React + Tailwind + Tiptap Editor (Rich Text).
*   **Backend (API)**: Node.js (NestJS/Express).
*   **Data Layer**: 
    *   **PostgreSQL**: Project/Section/Criteria 關聯資料。
    *   **pgvector**: 向量檢索。
    *   **Supabase Storage**: 檔案存儲。
*   **AI Layer**: 
    *   LLM: OpenAI GPT-4o / Gemini.
    *   Embedding: text-embedding-3-large / Gemini Embedding.
*   **Orchestration**: n8n (負責爬蟲、解析、批量生成流程)。
*   **Connector**: Google Drive, Local Upload, Web Crawler.

---

## 4. 功能模組與流程設計

### 4.1 專案與標案管理 (Projects & Tender)
*   建立專案、上傳標案文件 (PDF)。
*   **Tender Parsing Job**: 解析 PDF → Chunks → 透過 LLM 分析出「評選構面 (Criteria)」與「需求重點」。

### 4.2 知識來源與 Connector
*   **通用匯入流程**: 無論來源 (Local/Drive/Web)，統一轉為 Document -> Chunk -> Embedding -> 寫入 DB。
*   **WebCrawler**: 支援網址爬取、去雜訊、存入 System KB。

### 4.3 專案知識庫管理 (Project KB)
*   **引用關係**: Project KB 表只記錄關聯 (Project <-> Source)，不複製資料。
*   使用者可從全域庫中「勾選」加入此專案。

### 4.4 章節大綱生成 (Section Outline)
*   輸入：Tender 解析後的 Criteria 與需求。
*   輸出：建議的章節列表 JSON (含 section_type, title, linked_criteria_ids)。
*   前端：支援拖拉排序、改名、增刪。

### 4.5 章節內容生成 (Draft Generation with RAG)
*   使用 Project KB 進行 RAG 檢索。
*   Prompt 限制：僅能依據檢索到的 chunks 撰寫。
*   回傳：Content + Citations (引用來源 ID)。

### 4.6 外部搜尋與候選匯入
*   UI 提供「搜尋外部輔助資料」。
*   Agent 搜尋並列出摘要 (Snippet)。
*   使用者勾選 -> 匯入 Project KB -> 重新生成草稿。

### 4.7 Inline AI 修正
*   針對選取文字進行：重寫、擴寫、縮寫、風格調整。
*   Context 包含該章節上下文與 Project KB。

---

## 5. 資料模型設計 (Schema 簡化版)

### Core Entities
*   **Projects**: `id`, `name`
*   **Sources**: `id`, `type` (internal/external/tender), `connector_type`, `origin_detail`
*   **Chunks**: `id`, `source_id`, `text`, `embedding`, `metadata`
*   **ProjectKB**: `project_id`, `source_id` (關聯表)

### Logic Entities
*   **Criteria**: `id`, `project_id`, `group`, `title`, `weight`, `tender_chunks`
*   **Sections**: `id`, `project_id`, `title`, `criteria_ids`
*   **Drafts**: `id`, `section_id`, `content`, `citations`

---

## 6. 開發 Roadmap (Phase 1: MVP)

### Phase 1: 基礎 MVP (內部知識 + 標案解析)
1.  **專案管理**: 建立 Project。
2.  **Tender 上傳解析**: WF01 (Ingestion) + WF02 (Criteria Parsing)。
3.  **Section Suggestion**: 依據 Criteria 產生大綱。
4.  **Internal KB**: 支援 Local 文件上傳與向量化。
5.  **Project KB**: 建立 Project 與 Source 關聯。
6.  **Draft Generation**: 基礎 RAG 生成與 Citation 顯示。

### Phase 2: 外部資料擴充
*   WebCrawler Connector。
*   External Candidates UI。

### Phase 3: 進階體驗
*   Google Drive Connector。
*   Inline AI Rewrite。
*   NotebookLM 式引用追溯介面。
