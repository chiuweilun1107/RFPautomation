# 專案技術藍圖 (Project Technical Blueprint)

---

## 1. 系統架構設計 (System Architecture)

本系統採用 **「現代化 JAMstack + 本地 AI 編排」** 的混合架構，確保前端操作流暢性與後端資料隱私安全性。

### 1.1 核心元件 (Core Components)
*   **Frontend (操作層)**: 
    *   **Framework**: Next.js 16 (App Router)
    *   **Styling**: Tailwind CSS + Shadcn/ui (提供高品質協作 UI)
    *   **State**: React Query (Server State) + Zustand (Client State)
*   **Backend (資料層)**:
    *   **Platform**: Supabase
    *   **Auth**: Supabase Auth (Email/Password, SSO)
    *   **Database**: PostgreSQL
    *   **Vector Store**: pgvector extension (存儲知識庫 Embedding)
    *   **Realtime**: Supabase Realtime (用於多人協作鎖定狀態同步)
*   **AI Brain (邏輯層)**:
    *   **Engine**: n8n (Self-hosted via Docker)
    *   **LLM Providers**: OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet) - 透過 n8n 統一呼叫
    *   **Document Processing**: Python libs (in n8n custom nodes) 或是 AWS Textract (若本地 OCR 不足)

### 1.2 部署架構 (Deployment)
*   **Frontend**: Vercel (Production/Preview)
*   **Backend**: Supabase Cloud (或 Self-hosted for strict privacy)
*   **n8n**: Docker Container (部署於內網 Server 或 AWS EC2，需確保與 Supabase 連線暢通)

---

## 2. 資料庫設計 (Database Schema)

### 2.1 核心表結構 (Core Tables)

#### `projects` (標案專案)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| title | text | 標案名稱 |
| owner_id | uuid | FK -> auth.users |
| original_file_url | text | 原始上傳檔案路徑 (Storage) |
| status | text | 'draft', 'processing', 'active', 'completed' |
| created_at | timestamp | |

#### `sections` (章節 - 樹狀結構)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| project_id | uuid | FK -> projects.id |
| parent_id | uuid | FK -> sections.id (Self-reference for hierarchy) |
| type | text | 'chapter', 'table_row', 'requirement' |
| content | text | 原始章節標題或內文 |
| order_index | int | 排序用 |

#### `tasks` (填寫任務 - 最小單元)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| section_id | uuid | FK -> sections.id |
| requirement_text | text | 需回答的問題/需求描述 |
| response_draft | text | AI 生成的初稿 |
| response_final | text | 人工確認的完稿 |
| assigned_to | uuid | FK -> auth.users |
| status | text | 'pending', 'drafted', 'reviewing', 'approved', 'locked' |
| lock_token | text | 用於即時協作鎖定 (存 session_id) |
| ai_confidence | float | AI 信心分數 (0.0-1.0) |
| generated_mode | text | 'rag', 'creative' (標記來源) |

#### `knowledge_docs` (知識庫文件)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid | PK |
| content | text | 切塊後的純文字 |
| source_filename | text | 來源檔名 |
| tags | text[] | 標籤 (e.g., '資安', '實績') |
| embedding | vector(1536) | pgvector 向量資料 |
| is_archived_answer | boolean | 是否來自過往標案的正式回答 (高權重) |

---

## 3. n8n 自動化流程設計 (n8n Workflow Design)

### WF-01: Document Parsing Strategy (核心亮點)
*   **Trigger**: Webhook (from App when file uploaded)
*   **Logic**:
    1.  **Format Check**: 判斷 `.docx`, `.pdf`, `.xlsx`.
    2.  **Route - DOCX**:
        *   使用 `unzip` 解開 xml 結構。
        *   **Table Extraction**: 定位所有 `w:tbl`，將第一欄視為「項目」，第二/三欄視為「需求」。
        *   **Heading Hierarchy**: 建立章節樹 (Section Tree)。
    3.  **Route - Excel (Security Queue)**:
        *   尋找含有 "Yes/No" 或 "Desc" 的 Column Index。
        *   Mapping 為 Q&A Pair。
    4.  **Route - PDF**:
        *   OCR -> Text -> LLM JSON Extraction (Expensive but necessary).
*   **Output**: 呼叫 Supabase API 批量寫入 `sections` 與 `tasks`。

### WF-02: Hybrid Generation (混合生成)
*   **Trigger**: Webhook (User clicks "Generate" or "Auto-fill")
*   **Logic**:
    1.  **Search**: 用 Task 題目去做 Embedding Search。
    2.  **Decision**:
        *   If `similarity > 0.8`: **RAG Path** (直接引用 + 微調)。
        *   If `similarity < 0.8`: **Creative Path** (Input: 產品白皮書 context + Prompt "Create 3 options").
    3.  **Update**: 寫回 `tasks.response_draft`。

### WF-03: Knowledge Feedback Loop (自適應循環)
*   **Trigger**: Project marked as `Completed`.
*   **Logic**:
    1.  Select all `tasks` where `status = approved`.
    2.  **PII Scrubbing**: 透過 LLM 去除人名、電話、金額。
    3.  **Upsert**: 存入 `knowledge_docs` 並標記 `is_archived_answer = true`。

---

## 4. 目錄結構 (Directory Structure)

```
/
├── backend/                # Supabase Edge Functions & Migrations
│   ├── supabase/
│   │   ├── functions/      # Deno-based Edge Functions
│   │   └── migrations/     # SQL Schema (pgvector setup)
│   └── n8n/                # n8n Workflow JSON exports (Backup)
├── frontend/               # Next.js App
│   ├── app/                # App Router
│   ├── components/         # Shadcn UI Components
│   ├── lib/
│   │   ├── supabase/       # Supabase Client
│   │   └── api/            # n8n Webhook Triggers
│   └── types/              # TypeScript Interfaces
├── specs/                  # JSON Schemas
├── docs/                   # Documentation
├── PROJECT_REQUIREMENTS.md
├── PROJECT_BLUEPRINT.md    # This file
└── project.config.yaml     # Machine readable config
```
