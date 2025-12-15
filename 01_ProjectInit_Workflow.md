# 01_專案啟動工作流程 (Project Initiation Workflow)

---

## 前言：自動化的專案啟動

**請注意：** 本框架的設計旨在**自動化**專案的初始階段。當您提供專案需求文件時，系統會**自動識別**您的意圖，並指派專案經理代理 (`PM-Adam`) 直接接手，無需您下達額外的啟動指令。

後續的階段 (如技術藍圖、UI 設計等) 則建議使用下方的「標準化指令集」來精確推進。

---

## 目的

本文件是指導 **主 AI (Orchestrator AI)** 如何處理 **任何新專案啟動請求** 的 **首要工作流程**。它的核心職責是**識別使用者意圖**並**指派對應的代理**來處理請求。

---

## Phase 1: 專案啟動與代理指派 (Project Initiation & Agent Delegation)

*   **觸發條件 (Trigger):**
    *   **主要觸發:** 當使用者在對話初期上傳了看似專案需求的文件 (如 `需求說明書.txt`, `網站功能.md` 等)，且未提供其他特定指令 (如「摘要這份文件」) 時。
    *   **次要觸發 (備用):** 使用者明確下達 `AI project init "專案名稱"` 指令。

*   **主 AI 行動 (Orchestrator AI's Action):**
    1.  **意圖識別:** 判斷使用者意圖為「啟動新專案」。
    2.  **掃描 `agents/` 資料夾:** 尋找 `role` 為 "Project Manager" 的代理定義檔。
    3.  **載入代理:** 讀取 `agents/project_manager.md` 的內容，將其作為該次互動的 sistema提示 (System Prompt)。
    4.  **委派任務:**
        > **主 AI 必須以以下格式回應:**
        > "🤖 偵測到專案啟動意圖。正在指派專案管理代理..."
        > ---
        > **Agent: @PM-Adam**
        > (接下來的對話將由 PM-Adam 代理接管)

*   **負責代理 (Responsible Agent):** `PM-Adam` (或任何 `role` 為 "Project Manager" 的代理)

*   **代理行動宣告:**
    > **PM-Adam 必須回應:** "您好，我是專案經理 Adam。已接收到您提供的專案文件。為了將您的想法具體化，我將遵循 `02_RequirementsSpec_Template.md` 的結構，與您進行合作。在深入探討之前，我已對文件進行了初步分析並整理出幾個關鍵問題需要與您澄清..."

*   **代理任務 (Agent's Task):**
    *   **情境判斷:**
        *   **若使用者提供文件:** 進入「文件分析與生成」流程。
        *   **若使用者沒有文件:** 進入「需求探詢」流程 (互動式問答)。
    *   **基礎建設搭建 (Infrastructure Scaffolding) [AUTOMATIC]:**
        *   在開始需求分析前，PM-Adam **必須** 檢查並建立 `specs/` 目錄。
        *   **必須** 自動寫入以下兩個核心 Schema 檔案 (內容請參考 System Architect 的定義)：
            1.  `specs/project_config.schema.json`
            2.  `specs/task_plan.schema.json`
    *   **遵循 `02_RequirementsSpec_Template.md` 的結構**，完成 `PROJECT_REQUIREMENTS.md` 的初稿。
    *   與使用者進行迭代修改，直到需求文件最終確認。
*   **階段完成與行動指引:**
    > **當文件確認後，PM-Adam 必須回應:** "✅ **專案啟動階段已完成。** `PROJECT_REQUIREMENTS.md` 已最終確認。
    > **接下來，您可以：**
    >  * **啟動技術藍圖規劃:** 請下達指令 `AI plan blueprint`"

---

## Phase 2: 技術藍圖規劃 (由 System Architect 代理執行)

*   **觸發條件 (Trigger):** 使用者下達 `AI plan blueprint` 指令。
*   **主 AI 行動 (Orchestrator AI's Action):**
    1.  **識別指令:** 確認為技術藍圖規劃請求。
    2.  **掃描 `agents/` 資料夾:** 尋找 `role` 為 "System Architect" 的代理定義檔。
    3.  **載入代理:** 讀取 `agents/system_architect.md` 的內容，將其作為該次互動的系統提示 (System Prompt)。
    4.  **委派任務:**
        > **主 AI 必須以以下格式回應:**
        > "🤖 `plan blueprint` 指令已接收。正在指派系統架構師代理..."
        > ---
        > **Agent: @SA-Leo**
        > (接下來的對話將由 SA-Leo 代理接管)
*   **代理任務 (Agent's Task):**
    *   `SA-Leo` 代理將嚴格遵循 `03_Blueprint_Guide.md` 的流程，透過互動式問答與您確認技術選型和規範，最終生成 `PROJECT_BLUEPRINT.md` 和所有位於 `docs/` 目錄下的規範文件。
*   **階段完成與行動指引:**
    > **當文件集生成完畢後，SA-Leo 必須回應:** "✅ **技術藍圖規劃階段已完成。** 所有藍圖與規範文件皆已生成。
    > **接下來，您可以：**
    >  * **啟動 UI/UX 設計:** 請下達指令 `AI design ui`"

---

## Phase 2.5: UI/UX 設計 (由 UI/UX Designer 代理執行)

*   **觸發條件 (Trigger):** 使用者下達 `AI design ui` 指令。
*   **主 AI 行動 (Orchestrator AI's Action):**
    1.  **識別指令:** 確認為 UI/UX 設計請求。
    2.  **掃描 `agents/` 資料夾:** 尋找 `role` 為 "UI/UX Designer" 的代理定義檔。
    3.  **載入代理:** 讀取 `agents/ui_ux_designer.md` 的內容，將其作為該次互動的系統提示 (System Prompt)。
    4.  **委派任務:**
        > **主 AI 必須以以下格式回應:**
        > "🤖 `design ui` 指令已接收。正在指派 UI/UX 設計師代理..."
        > ---
        > **Agent: @UI-Mia**
        > (接下來的對話將由 UI-Mia 代理接管)
*   **代理任務 (Agent's Task):**
    *   `UI-Mia` 代理將根據 `PROJECT_REQUIREMENTS.md`，主動創建 `docs/design_system.md` 和 `docs/wireframes/` 下的線框圖文件。
*   **階段完成與行動指引:**
    > **當設計文件生成完畢後，UI-Mia 必須回應:** "✅ **UI/UX 設計階段已完成。** 設計系統與線框圖皆已生成。
    > **接下來，您可以：**
    >  * **啟動開發任務規劃:** 請下達指令 `AI plan tasks`"

---

## Phase 3: 開發任務規劃 (由 Project Manager 代理執行)

*   **觸發條件 (Trigger):** 使用者下達 `AI plan tasks` 指令。
*   **主 AI 行動 (Orchestrator AI's Action):**
    1.  **識別指令:** 確認為任務規劃請求。
    2.  **掃描 `agents/` 資料夾:** 尋找 `role` 為 "Project Manager" 的代理定義檔。
    3.  **載入代理:** 讀取 `agents/project_manager.md` 的內容，將其作為該次互動的系統提示 (System Prompt)。
    4.  **委派任務:**
        > **主 AI 必須以以下格式回應:**
        > "🤖 `plan tasks` 指令已接收。正在指派專案管理代理進行任務拆解..."
        > ---
        > **Agent: @PM-Adam**
        > (接下來的對話將由 PM-Adam 代理接管)
*   **代理任務 (Agent's Task):**
    *   `PM-Adam` 代理將嚴格遵循 `04_TaskCreation_Framework.md` 的流程，將需求分解為技術任務，分析依賴關係，並最終生成 `docs/TODO.md` 和 `docs/tasks/` 下的所有任務文件。
*   **階段完成與行動指引:**
    > **當任務文件生成完畢後，PM-Adam 必須回應:** "✅ **開發任務規劃階段已完成。** 所有有序的任務文件已生成。
    > **接下來，您可以：**
    >  * **執行開發任務:** 請下達指令 `AI do task [Task-ID]`"

---

## Phase 4 & 5: 開發、審查與完成 (多代理協作)

### 4.1 開發執行

*   **觸發條件 (Trigger):** 使用者下達 `AI do task [Task-ID]` 指令。
*   **主 AI 行動 (Orchestrator AI's Action):**
    1.  **解析任務ID:** 根據 `[Task-ID]` 的前綴 (如 `FE-`, `BE-`, `DB-`) 判斷任務類型。
    2.  **掃描並載入代理:**
        *   **掃描 `agents/` 資料夾:** 尋找對應 `role` 的代理定義檔。
        *   **如果前綴為 `FE-`:** 載入 `role` 為 "Frontend Engineer" 的代理檔案 (`frontend_engineer.md`)。
        *   **如果前綴為 `BE-` 或 `DB-`:** 載入 `role` 為 "Backend Engineer" 的代理檔案 (`backend_engineer.md`)。
        *   **載入為系統提示:** 將讀取到的代理檔案內容，作為該次互動的系統提示 (System Prompt)。
    3.  **委派任務:**
        > **主 AI 必須以以下格式回應:**
        > "🤖 `do task [Task-ID]` 指令已接收。正在指派前端工程師代理..."
        > ---
        > **Agent: @FE-Ava**
        > (接下來的對話將由 FE-Ava 代理接管)
*   **代理任務 (Agent's Task):**
    *   被指派的開發代理 (`FE-Ava` 或 `BE-Rex`) 將遵循 `PROJECT_BLUEPRINT.md` 和 `03_Blueprint_Guide.md` 中定義的「任務執行階段準則」，完成開發、驗收與提交。
*   **階段完成與行動指引:**
    > **當開發與驗收完成後，開發代理必須回應:** "✅ 開發任務 [Task-ID] 已完成，所有驗收標準均已通過驗證。現移交進行程式碼審查。"

### 4.2 審查與完成

*   **觸發條件 (Trigger):** 開發代理回報「現移交進行程式碼審查」。
*   **主 AI 行動 (Orchestrator AI's Action):**
    1.  **掃描 `agents/` 資料夾:** 尋找 `role` 為 "QA Reviewer" 的代理定義檔。
    2.  **載入代理:** 讀取 `agents/qa_reviewer.md` 的內容，將其作為該次互動的系統提示 (System Prompt)。
    3.  **委派任務:**
        > **主 AI 必須以以下格式回應:**
        > "🤖 開發任務已提交。正在指派 QA 審查員代理..."
        > ---
        > **Agent: @QA-Sam**
        > (接下來的對話將由 QA-Sam 代理接管)
*   **代理任務 (Agent's Task):**
    *   `QA-Sam` 代理將審查程式碼，並向主 AI 回報 `✅ 審查通過` 或 `🚨 審查失敗`。
*   **最終完成 (由主 AI 執行):**
    *   **若審查通過:** 主 AI 負責更新 `docs/TODO.md` 狀態為 `✅ completed`，更新 `docs/CHANGELOG.md`，並向使用者建議下一個任務。
    *   **若審查失敗:** 主 AI 負責更新 `docs/TODO.md` 狀態為 `🔴 needs_rework`，並將 `QA-Sam` 的報告呈現給使用者，等待下一步指令。

---

## 後續流程指引

*   **需求確認後**，應遵循 `03_Blueprint_Guide.md` 來建立技術藍圖。
*   **藍圖確認後**，應遵循 `04_TaskCreation_Framework.md` 來規劃開發任務。
*   **開發規範選擇**，應參考 `06_DevelopmentStandards_Guide.md` 來選擇適合的規範套件：
    *   **基本規範套件**：適用於小型專案、原型開發
    *   **完整規範套件**：適用於中型專案、商業應用
    *   **企業級規範套件**：適用於大型專案、高安全要求

---

## 標準化指令集

本框架在專案啟動階段會自動識別意圖，但您也可以使用以下標準指令來精確控制後續流程：

1.  **專案初始化 (通常為自動觸發):**
    > `AI project init "專案名稱"`
    > (備註：當您上傳需求文件時，此流程通常會自動啟動。此指令可用於強制指定專案名稱，或在 AI 未能自動識別時手動啟動。)

2.  **啟動技術藍圖規劃:**
    > `AI plan blueprint`

3.  **啟動 UI/UX 設計:**
    > `AI design ui`

4.  **啟動開發任務規劃:**
    > `AI plan tasks`

5.  **執行具體任務:**
    > `AI do task [Task-ID]`

6.  **獲取專案狀態 (當您需要提醒 AI 專案上下文時):**
    > `AI status @PROJECT_BLUEPRINT.md`

7.  **選擇開發規範套件:**
    > `AI select standards [basic|complete|enterprise]`

當您使用最後一個指令時，AI 會被強制要求重新讀取藍圖，載入最新的文件地圖與上下文，確保它的後續行動是基於最新的專案狀態。 
