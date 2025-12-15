# 04_任務創建框架 (Task Creation Framework)

---

## 1. 目的與 AI 指令 (Purpose & AI Instructions)

**致 AI 模型：**

本文件是指導您在 `PROJECT_REQUIREMENTS.md` 與 `PROJECT_BLUEPRINT.md` 都確認後，如何 **將需求轉化為可執行的、有序的開發任務文件** 的框架。

您的核心職責是：
1.  將使用者故事分解為技術任務。
2.  **分析任務間的依賴關係，並與使用者確認 MVP，最終確定開發順序。**
3.  將包含依賴關係的、有序的任務列表，填充到 `docs/TODO.md` 和 `docs/tasks/` 目錄中。

---

## 2. 執行流程 (Execution Flow)

### **Phase 0: 框架啟動與情境載入**
*   **觸發指令:** `AI plan tasks`
*   **AI 行動宣告:**
    > **AI 必須回應:** "🤖 收到 `plan tasks` 指令。現在啟動 **04 號框架：任務創建框架**..."
*   **首要任務：** 讀取 `PROJECT_BLUEPRINT.md` 和 `PROJECT_REQUIREMENTS.md` 作為上下文。

### **Phase 1: 工作拆解與任務定義**
*   **AI 行動宣告:**
    > **AI 必須回應:** "✅ **Phase 0 已完成。** ... **目前進入：Phase 1 - 工作拆解與任務定義**..."
*   **核心任務：**
    1.  **分解使用者故事:** 遍歷 `PROJECT_REQUIREMENTS.md`，將使用者故事分解為技術任務。
    2.  **關聯規範文件:** 對於每個被分解出的技術任務，**必須** 分析其性質（例如：是後端 API 開發、前端 UI 實作、還是資料庫變更），並從 `docs/` 目錄中找出所有相關的規範文件。
        *   **前端任務的特殊要求:** 對於所有前端任務 (`Task-FE-XXX`)，除了關聯 `docs/frontend/` 下的技術規範外，**必須強制性地** 關聯 `docs/design_system.md` 以及 `docs/wireframes/` 中對應的頁面設計文件。
        *   **範例:**
            *   一個後端 API 開發任務 (`Task-BE-XXX`) 應關聯 `docs/backend/API_DESIGN.md`, `docs/security/BASIC_SECURITY.md`。
            *   一個前端 UI 任務 (`Task-FE-XXX`) 應關聯 `docs/frontend/CODING_STYLE.md`, `docs/design_system.md` (設計系統), `docs/wireframes/login-page.md` (頁面線框圖)。
            *   一個資料庫模型變更任務 (`Task-DB-XXX`) 應關聯 `docs/database/DESIGN_PRINCIPLES.md`。
    3.  **參考目錄結構與精確化文件路徑 (Reference Directory Structure & Specify File Paths):**
        *   **強制性前置步驟 (Mandatory Prerequisite):** 在為任何任務定義具體開發步驟之前，AI **必須** 查閱 `docs/architecture/DIRECTORY_STRUCTURE.md` 文件，以完全理解專案的標準目錄結構。
        *   **路徑規範化 (Path Specification):** 在生成 `## 4. 開發待辦清單 (Development Checklist)` 或 `## 3. 任務描述 (Description)` 時，任何提及「創建」或「修改」檔案的步驟，**必須** 包含該檔案的**完整相對路徑** (相對於專案根目錄)。此舉旨在消除路徑模糊性，確保 AI 能將文件放置在正確的位置。
        *   **範例 (Examples):**
            *   **前端元件:** "在 `frontend/src/components/features/` 目錄下建立 `LoginModal.tsx` 元件。" (錯誤示範: "建立一個登入元件")
            *   **後端服務:** "修改 `backend/src/modules/scraping/scraping.service.ts` 以新增 `handleTimeout` 方法。" (錯誤示範: "修改爬蟲服務")
            *   **DTO 物件:** "在 `backend/src/modules/scraping/dto/` 目錄下建立 `create-job.dto.ts`。" (錯誤示範: "建立 DTO")
    4.  **產生開發待辦清單:** 對於每個技術任務，基於其描述與難點，生成一份詳細的、可追蹤的 **開發待辦清單 (Development Checklist)**。此清單應將任務分解為具體的、可執行的開發步驟，並成為任務檔案內容的一部分。
    5.  **任務命名:** 所有任務必須遵循 `Task-[Type]-[Seq]` 的格式。
    6.  **創建初始化任務:**
        *   **任務ID:** `Task-Bootstrap-000`
        *   **任務名稱:** `專案初始化 (Project Initialization)`
        *   **任務描述:** 此任務的目標是創建專案的完整目錄結構和基礎樣板文件。
        *   **執行細則:** AI 在生成此任務時，**必須** 遵循一個動態的、基於藍圖的初始化流程。
            1.  **查閱藍圖 (Consult Blueprint):** AI 必須首先讀取 `PROJECT_BLUEPRINT.md` 中的 `1.2. 詳細技術棧` 表格，以確定專案選用的前端與後端框架。
            2.  **確定原生指令 (Determine Native Commands):** 根據識別出的框架 (例如: NestJS, Next.js, Angular, ASP.NET Core)，AI 必須自主確定對應的、官方推薦的專案初始化 CLI 指令。
            3.  **生成具體清單 (Generate Specific Checklist):** AI 需將這些確定的原生 CLI 指令，以及對核心設定檔 (`tsconfig.json`, `.csproj`, `angular.json` 等) 的存在性檢查，填寫為 `Task-Bootstrap-000` 的 `開發待辦清單` 和 `驗收標準`。AI **嚴禁** 使用 `npm init -y` 或其他非框架原生的通用指令。

### **Phase 2: 依賴性分析與優先級排序**
*   **AI 行動宣告:**
    > **AI 必須回應:** "✅ **Phase 1 已完成。** ... **目前進入：Phase 2 - 依賴性分析與優先級排序**..."
*   **核心任務:**
    1.  **分析依賴關係:** 分析所有已定義任務之間的依賴關係 (例如：`Task-FE-001` 依賴於 `Task-BE-002`)。
    2.  **確認 MVP 與優先級:** 主動詢問使用者第一階段的 MVP 範疇，結合依賴關係，確定所有任務的最終開發順序。
    3.  **輸出報告並獲取批准:** **必須** 向使用者展示一份 **「任務依賴性報告」**，清晰地列出任務間的依賴關係與建議的開發順序，並徵求使用者同意。

### **Phase 3: 填充任務文件**
*   **觸發條件:** 使用者確認「任務依賴性報告」的內容。
*   **AI 行動宣告:**
    > **AI 必須回應:** "✅ **Phase 2 已完成。** ... **目前進入：Phase 3 - 填充任務文件**..."
*   **核心任務:**
    1.  **創建追蹤文件:** **必須** 在 `docs/` 目錄下創建 `TODO.md` 和 `CHANGELOG.md` (如果尚不存在)。
        *   `TODO.md`: 寫入 `附錄B` 範本中的標頭和狀態圖示說明。
        *   `CHANGELOG.md`: 寫入初始標頭，例如 `# 變更日誌 (Changelog)`。
    2.  **填充詳細任務文件:** 根據已排序的列表，在 `docs/tasks/` 目錄下生成所有任務的 `.md` 文件，並 **必須將其依賴項寫入文件頭部**。遵循 **附錄A：任務文件內容範本**。
    3.  **填充總覽儀表板:** 在 `docs/TODO.md` 檔案中，按照最終確認的 **優先級順序** 生成總覽表格。遵循 **附錄B：TODO.md 內容範本**。

### **Phase 4: 交付與可選拆解 (Handoff & Optional Decomposition)**
*   **AI 行動宣告 (Handoff):**
    > **AI 必須回應:** "✅ **Phase 3 已完成。** 所有有序的任務文件已在 `docs/` 目錄中生成。
    >
    > **請您檢視 `docs/TODO.md` 中的任務列表。**
    >
    > 如果您認為任何任務粒度過大，需要進一步拆解，請使用以下指令：
    > `AI decompose task [Task-ID] "拆解理由"`
    >
    > 如果任務列表沒有問題，您可以開始執行第一個任務：
    > `AI do task Task-000`"
*   **拆解任務的執行邏輯 (Decomposition Logic):**
    *   **觸發指令:** `AI decompose task [Task-ID] "[Reason]"`
    *   **AI 行動:**
        1.  **確認與讀取:** AI 確認收到指令，讀取 `docs/tasks/[Task-ID].md` 以了解原始任務的完整上下文。
        2.  **互動式拆解:** AI 與使用者進行互動，確認需要拆解出的子任務數量、以及每一個子任務的 **任務描述** 與 **核心目標**。
        3.  **生成獨立子任務:** 針對每一個確認的子任務，AI **必須** 執行以下操作：
            *   **創建新文件:** 在 `docs/tasks/` 目錄下創建一個全新的、獨立的 Markdown 文件。檔案命名規則為 `[原始任務ID]-[子任務序號].md` (例如: `Task-BE-005-1.md`)。
            *   **填充完整內容:** 新的子任務文件 **必須嚴格且完整地複製 `附錄A` 的所有章節結構**。AI 的職責是為這個新的子任務，填充所有對應的內容，特別是：
                *   **重新生成** 一個全新的、針對該子任務的 `## 4. 開發待辦清單 (Development Checklist)`。
                *   **重新生成** 一套全新的、針對該子任務的 `## 6. 驗收標準 (Acceptance Criteria)`。
                *   從父任務繼承 `參考規範` 和 `來源使用者故事`。
        4.  **修改原始任務文件:**
            *   AI **必須** 修改原始的 `docs/tasks/[Task-ID].md` 文件。
            *   **移除** 原有的 `## 4. 開發待辦清單` 和 `## 6. 驗收標準` 章節。
            *   **修改** `## 3. 任務描述`，在其末尾追加說明，表示此任務已被分解為多個子任務。
            *   **追加新章節:** 在文件末尾追加一個新的章節 `## 8. 子任務清單 (Sub-task List)`，其中包含一個指向所有新創建的子任務文件的 **連結列表**。
        5.  **更新 `TODO.md`:**
            *   在 `docs/TODO.md` 中，將原始 `Task-ID` 的狀態更新為 `🔗 decomposed`。
            *   在其緊鄰的下方，**插入** 所有新子任務的條目。每個子任務條目的 `詳細內容` 欄位 **必須** 連結到其對應的獨立文件 (例如: `[查看](./tasks/Task-BE-005-1.md)`)。
        6.  **完成回報:** 向使用者報告拆解已完成，並展示更新後的 `TODO.md` 中與此次拆解相關的區塊。

---

## 附錄 (Appendices)

### 附錄A：任務文件內容範本 (`docs/tasks/Task-XXX.md`)
AI 在填充每個 `.md` 任務文件時，**必須** 遵循以下完整結構：
```markdown
# Task-FE-001: 建立使用者登入頁面

---

## 1. 任務元數據 (Metadata)
*   **優先級 (Priority):** 高
*   **難易度 (Difficulty):** 中等
*   **依賴項 (Dependencies):** 
    *   `Task-BE-002` (使用者認證API)

---

## 2. 參考規範 (Reference Specifications)
*   **前端開發:** [前端程式碼風格指南](../../frontend/CODING_STYLE.md)
*   **設計系統:** [專案設計系統指南](../../design_system.md)
*   **頁面線框圖:** [登入頁面線框圖](../../wireframes/login-page.md)
*   **無障礙設計:** [無障礙設計指南](../../frontend/ACCESSIBILITY.md)
*   **效能優化:** [前端效能優化指南](../../frontend/PERFORMANCE.md)

---

## 3. 任務描述 (Description)
根據需求規格，建立一個包含帳號、密碼輸入框及登入按鈕的 Angular 元件。

### 3.1 難點說明 (Difficulty Explanation)
*   需要處理與後端 API 的非同步驗證，並管理 loading 狀態。
*   需要處理多種錯誤情境 (如：帳號錯誤、密碼錯誤、伺服器無回應) 並給予使用者清晰的回饋。

---

## 4. 開發待辦清單 (Development Checklist)
- [ ] 建立登入頁面的基礎 UI 元件 (`login.component.html`, `login.component.scss`)。
- [ ] 建立對應的 Component Class (`login.component.ts`) 並定義表單模型。
- [ ] 使用 Angular Reactive Forms 實現表單與模型的雙向綁定及驗證邏輯。
- [ ] 注入 `AuthService` 並實現 `login()` 方法的呼叫邏輯。
- [ ] 處理 API 呼叫的 loading 狀態 (例如：顯示 spinner)。
- [ ] 處理並顯示登入成功後的回饋 (跳轉頁面)。
- [ ] 處理並顯示所有登入失敗的錯誤情境及 UI 反饋。

---

## 5. 來源使用者故事 (Source User Story)
> 身為一位 **訪客**，我想要 **看到登入頁面**，以便 **能輸入帳號密碼**。

---

## 6. 驗收標準 (Acceptance Criteria)
- [ ] 頁面路徑為 `/login`。
- [ ] 包含一個 "email" 型別的輸入框。
- [ ] 包含一個 "password" 型別的輸入框。
- [ ] 所有輸入框都有必填驗證。
- [ ] 按下「登入」按鈕後，會觸發 `authService.login()` 方法。
- [ ] 成功登入後，頁面跳轉至 `/dashboard`。
- [ ] 失敗時，顯示對應的錯誤訊息。

---

## 7. 完成後續動作 (Post-completion Actions)
*   **更新變更日誌:** 任務完成後，必須遵循 `PROJECT_BLUEPRINT.md` 的 `5.2 任務執行階段準則`，在 `docs/CHANGELOG.md` 中追加此任務的摘要報告。

```

### 附錄B：TODO.md 內容範本 (`docs/TODO.md`)
AI 在填充 `TODO.md` 儀表板時，**必須** 包含以下所有欄位，並按 **優先級** 排序：
```markdown
# 專案任務看板 (Project Task Board)

**狀態圖示說明 (Status Legend):**
*   ⚪️ `pending` (尚未開始)
*   🔵 `in_progress` (進行中)
*   ✅ `completed` (已完成)
*   🚧 `blocked` (被阻擋)
*   🔗 `decomposed` (已拆解為子任務)
*   🔴 `needs_rework` (審查失敗，需要返工)

| 狀態 | 優先級 | 任務ID | 任務描述 | 依賴項 | 詳細內容 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ⚪️ | **最高** | `Task-Bootstrap-000` | 專案初始化 | - | [查看](./tasks/Task-Bootstrap-000.md) |
| 🚧 | 高 | `Task-BE-002` | 開發使用者認證API | `Task-DB-001` | [查看](./tasks/Task-BE-002.md) |
| ⚪️ | 高 | `Task-FE-001` | 建立使用者登入頁面 | `Task-BE-002` | [查看](./tasks/Task-FE-001.md) |
| 🔗 | 中 | `Task-FE-003` | 建立產品列表頁 | `Task-BE-004` | [查看](./tasks/Task-FE-003.md) |
| 🔵 | 中 | `Task-FE-003-1` | 產品列表 UI | `Task-BE-004` | [查看](./tasks/Task-FE-003-1.md) |
| ⚪️ | 中 | `Task-FE-003-2` | 實現篩選功能 | `Task-BE-004` | [查看](./tasks/Task-FE-003-2.md) |

```