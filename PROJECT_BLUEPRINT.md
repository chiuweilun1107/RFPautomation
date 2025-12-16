# 專案技術藍圖 (Project Technical Blueprint)

---

## 1. 系統架構設計 (System Architecture)

採用 **「RAG-First Knowledge Assistant」** 架構，核心在於多源知識庫的整合與高精準度的引用生成。

### 1.1 核心元件 (Core Components)
*   **Frontend (Next.js 16)**:
    *   **Editor**: Tiptap (Headless rich text editor)，需客製化 `CitationNode` 來顯示引用來源。
    *   **State Management**: Zustand (Client) + React Query (Server)。
    *   **UI Library**: Shadcn/ui (Tailwind)。
*   **Backend (NestJS / Node.js)**:
    *   **API Layer**: 處理複雜的業務邏輯 (如構面關聯、權限控制)。
    *   **Orchestration**: n8n (負責長流程：爬蟲、檔案解析、批量生成)。
*   **Data Layer (Supabase)**:
    *   **PostgreSQL**: 關聯式資料 (Projects, Sections, Criteria)。
    *   **pgvector**: 向量檢索 (Chunks embedding)。
    *   **Storage**: 原始檔案存儲 (PDF, DOCX)。

### 1.2 部署架構
*   **App**: Vercel
*   **DB**: Supabase (Cloud/Self-hosted)
*   **Workers**: n8n (Docker)

---

## 2. 資料庫設計 (Database Schema)

### 2.1 知識庫與來源 (Knowledge & Sources)

#### `sources` (知識來源)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| project_id | uuid | FK (Optional, if null means 'Global/Internal KB') |
| type | text | 'markdown', 'pdf', 'docx', 'web_crawl' |
| title | text | 檔案名稱或網頁標題 |
| origin_url | text | 原始 URL (for web) or Storage Path (for file) |
| status | text | 'processing', 'ready', 'error' |

#### `chunks` (切塊內容)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| source_id | uuid | FK -> sources.id |
| content | text | 切分後的文字片段 |
| embedding | vector(1536) | OpenAI/Cohere embedding |
| metadata | jsonb | `{ page: 1, section: "2.1" }` |

#### `project_sources` (專案-來源關聯)
| Column | Type | Description |
| :--- | :--- | :--- |
| project_id | uuid | FK -> projects.id |
| source_id | uuid | FK -> sources.id |
| created_at | timestamp | 加入時間 |

### 2.2 標案與評分 (Tender & Criteria)

#### `criteria` (評分構面)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| project_id | uuid | FK -> projects.id |
| group_name | text | e.g. "技術能力", "價格" |
| title | text | e.g. "系統安全性" |
| weight | float | 配分權重 |
| description | text | 詳細說明 |

#### `sections` (章節結構)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| project_id | uuid | FK -> projects.id |
| title | text | 章節標題 |
| content_draft | text | AI 生成的草稿 (HTML) |
| criteria_ids | uuid[] | 關聯的 Criteria IDs (Array) |

---

## 3. n8n 自動化流程 (Workflows)

### WF-01: Ingestion Pipeline (檔案入庫)
*   **Trigger**: File Uploaded to Storage bucket `raw-files`.
*   **Steps**:
    1.  **Identify Type**: PDF (Textract/OCR) vs DOCX (mammoth/unzip).
    2.  **Text Extraction**: 轉為純文字。
    3.  **Chunking**: Recursive Character Splitter (size: 1000, overlap: 200).
    4.  **Embedding**: OpenAI `text-embedding-3-small`.
    5.  **Upsert**: 寫入 `sources` 與 `chunks` 表。

### WF-02: Tender Parsing (標案解析)
*   **Trigger**: User clicks "Parse Tender".
*   **Steps**:
    1.  **Load Source**: 讀取代解析的 Tender Source。
    2.  **LLM Criteria Extraction**: 
        *   Prompt: "Extract grading criteria table into JSON: { group, title, weight, desc }".
    3.  **Save**: 批量寫入 `criteria` 表。
    4.  **LLM Outline Suggestion**:
        *   Prompt: "Based on these criteria, suggest a table of contents".
    5.  **Save**: 寫入 `sections` 表 (Initial structure).

### WF-03: Draft Generation (RAG 草稿)
*   **Trigger**: API call `POST /generate-draft`.
*   **Input**: `section_id`, `criteria_ids`.
*   **Steps**:
    1.  **Retrieve Context**: 
        *   用 Criteria Title + Desc 去搜尋 `chunks` (scoped to current `project_sources`).
    2.  **Generate**: 
        *   System Prompt: "You are a proposal writer. Use ONLY the provided chunks. Cite sources as [SourceID]."
    3.  **Post-process**: 解析引用標記，轉換為 Frontend 格式。
    4.  **Update**: 更新 `sections.content_draft`。

---

## 4. API 介面設計 (API Stubs)

*   `POST /api/projects/:id/sources` - 加入來源 (Upload/Crawl)
*   `GET /api/projects/:id/criteria` - 取得評分構面
*   `POST /api/projects/:id/generate/:sectionId` - 觸發生成
*   `POST /api/chat/inline-edit` - 編輯器內 AI 指令
