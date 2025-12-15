# 專案需求規格書：Web-based RFP 自動化標案系統 (RFP Automation System)

---

## 1. 專案總覽 (Project Overview)

*   **專案名稱 (Project Name):** Web-based RFP Automation System (智慧標案自動化填寫系統)
*   **專案背景 (Background):**
    *   投標工作（政府標案、企業 RFP）通常涉及大量繁瑣的文件處理與重複性回答。
    *   現有知識散落在各處（舊文件、PM 腦中），導致每次填寫標單都要「重造輪子」。
    *   台灣政府標案格式複雜（DOCX 表格、公文架構），通用型 AI 工具難以精準拆解。
*   **核心目標 (Goals / Objectives):**
    *   **目標一：全格式支援 (Multi-Format Support)** - 支援 DOCX/PDF/Excel (XLSX) 標案文件，自動拆解為「原子化」的待辦任務清單。
    *   **目標二：智慧生成 (Smart Generation)** - 運用 RAG (檢索增強生成) 技術，自動從過往實績中填寫擬答；若無資料則啟動「創作模式」。
    *   **目標三：自適應知識庫 (Adaptive Knowledge Loop)** - 經由人類審修後的最終答案，必須自動回饋至知識庫 (Auto-Learning)，形成數據飛輪。
    *   **目標四：無損匯出 (Perfect Replication)** - 確保填寫完成後，能匯出與原標案格式完全一致的文件 (DOCX/XLSX)。
*   **範圍定義 (Scope Definition):**
    *   **範圍內 (In-Scope):**
        *   React/Next.js 前端平台 (Dashboard, Editor, Admin)。
        *   Supabase 後端 (Auth, DB, Realtime, Vector Store)。
        *   n8n 本地化自動化流程 (ETL, Parsing, Generation, Feedback Loop)。
        *   **Parser 模組**: 支援 DOCX (公文表格)、PDF (文字層/OCR)、XLSX (資安問卷) 解析。
        *   **Library 模組**: 知識庫管理介面 (審核、分類、標籤)。

## 2. 使用者角色 (User Personas)

*   **角色一：標案經理 (Proposal Manager - PM)**
    *   描述: 專案負責人，負責上傳標案、分派任務、審核內容與最終匯出。
    *   權限: 專案建立、成員指派、全域編輯、匯出。
*   **角色二：業務/技術寫手 (Contributor)**
    *   描述: 負責填寫特定章節的專業人員（如 Sales 填寫資格證明，Engineer 填寫技術規格）。
    *   權限: 被指派區塊的編輯與 AI 協作功能。
*   **角色三：系統管理員 (Admin)**
    *   描述: 負責維護知識庫、監控 n8n 流程與系統設定。

## 3. 資訊架構與頁面規劃 (Information Architecture)

*   **網站地圖 (Sitemap):**
    *   **登入/註冊頁 (Login/Register)**
    *   **儀表板 (Dashboard)**
        *   進行中標案列表
        *   待辦任務概覽
    *   **標案工作區 (Project Workspace)**
        *   **任務清單視圖 (List View)**: 顯示拆解後的章節與進度。
        *   **編輯器視圖 (Editor View)**: 雙欄式 (左側原文/右側編輯 + AI Assist)。
        *   **文件預覽 (Preview)**
    *   **知識庫中心 (Knowledge Hub)**
        *   過往實績上傳 (Upload)
        *   資料清洗預覽 (Clean & Chunk)
    *   **設定 (Settings)**
        *   成員管理
        *   API Key 設定 (OpenAI, Anthropic)

## 4. 功能史詩與使用者故事 (Epics & User Stories)

### Epic 1: 智慧文件處理 (Intelligent Document Processing)
*   **Feature 1.1: 多格式結構化拆解 (Multi-Format Parsing)**
    *   **Story:** 身為 PM，我上傳標案文件 (DOCX/PDF/Excel)，系統能自動識別章節結構與題目，並拆解為獨立任務。
    *   **詳細邏輯 (Detailed Logic):**
        *   **DOCX**: 識別 Heading 樣式與表格 (Table) 邊界，提取關鍵欄位 ( Requirement)。
        *   **Excel (Security Questionnaire)**: 自動偵測 "Question" 與 "Answer" 欄位索引，處理下拉選單驗證，並將每一列視為獨立 Record。
        *   **PDF**: 使用 OCR (如 AWS Tesseract 或本地方案) 轉換為純文字，再進行 LLM 結構化提取，需特別處裡跨頁表格問題。
    *   **驗收標準:**
        *   Given 上傳 `security_questionnaire.xlsx`
        *   When 解析完成
        *   Then 系統應識別出 200 個獨立問題，並正確對應到 "Response" 欄位。
*   **Feature 1.2: 原檔與填答回填 (In-Place Export)**
    *   **Story:** 身為 PM，我希望匯出的檔案格式與原檔完全一致。
    *   **驗收標準:**
        *   Given 所有任務已完成
        *   When 點擊匯出
        *   Then 下載的文件 (DOCX/XLSX) 格式跑版率應 < 1%，所有答案應填入正確儲存格。

### Epic 2: AI 混合生成引擎 (Hybrid Generation Engine)
*   **Feature 2.1: RAG 知識檢索**
    *   **Story:** 當我點擊「自動填寫」時，AI 應優先從「過往實績」中搜尋高信心度的答案。
*   **Feature 2.2: 創作模式 (Creative Mode Fallback)**
    *   **Story:** 若知識庫無相關資料，AI 應自動切換至創作模式，根據公司技術棧 (Supabase/Next.js) 生成 3 種不同策略的草稿供我選擇。
    *   **驗收標準:**
        *   Given 知識庫無"語音客服"資料
        *   When 請求生成
        *   Then AI 標示 `⚠️ Creative Mode` 並提供 [保守/創新/低成本] 三個選項。
*   **Feature 2.3: 自適應知識循環 (Adaptive Knowledge Loop)**
    *   **Story:** 當標案結束並歸檔後 (Project Archived)，系統應自動將「最終版本回答」清洗並存回知識庫。
    *   **詳細邏輯:**
        *   Trigger: 專案狀態變更為 `Completed`。
        *   Process: 提取所有 `Approved` 狀態的 Task 回答 -> 去除 PII -> 生成 Embedding -> 存入 `knowledge_vectors` 表。
        *   Effect: 下一次遇到類似題目，這些答案即成為 RAG 的來源 (Flywheel Effect)。

### Epic 3: 互動式編輯與協作 (Interactive Editing)
*   **Feature 3.1: AI 迭代修飾 (AI Assist)**
    *   **Story:** 我可以反白一段文字，要求 AI「更正式一點」或「縮短內容」，且能無限次迭代。
*   **Feature 3.2: 區塊級鎖定 (Block-level Locking)**
    *   **Story:** 當我正在編輯「2.1 需求」時，其他成員看到該區塊呈現「鎖定狀態」，無法同時編輯，避免衝突。

## 5. 非功能性需求 (Non-Functional Requirements)

*   **部署架構:**
    *   **AI Orchestration:** 必須使用 **n8n 自託管版本 (Self-hosted)**，確保標案機密不外流至第三方 SaaS 平台。
    *   **Vector DB:** 使用 Supabase `pgvector`，與主資料庫同源。
*   **資安隱私:**
    *   **ETL 清洗:** 上傳至知識庫的文件，必須經過 PII (個資) 去識別化處理流程。
*   **相容性:**
    *   必須完整支援 Microsoft Word `.docx` 格式 (Office 2013+)。

## 6. 資料模型 (Preliminary Data Model)

*   **Projects (標案專案)**: `id`, `title`, `original_file_url`, `status`
*   **Sections (章節)**: `id`, `project_id`, `parent_id`, `title`, `content` (原文)
*   **Tasks (填寫任務)**: `id`, `section_id`, `requirement_text`, `response_content`, `assigned_to`, `status`
*   **KnowledgeDocs (知識文件)**: `id`, `title`, `vector_id` (關聯至 embeddings)
*   **Embeddings (向量)**: 存於 `pgvector` 擴充表。

## 7. 系統流程參考 (System Workflow)
*   **Ingest**: User Upload -> n8n Parser -> Supabase DB (Tasks)
*   **Generate**: User Trigger -> n8n (RAG/LLM) -> Supabase DB (Drafts)
*   **Export**: User Export -> n8n (re-assembler) -> DOCX Download
