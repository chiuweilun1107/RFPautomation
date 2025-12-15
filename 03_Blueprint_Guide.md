# 03_技術藍圖生成指南 (Blueprint Generation Guide)

---

## 1. 目的與 AI 指令 (Purpose & AI Instructions)

**致 AI 模型：**

本文件是您在接獲「規劃專案架構」或「建立技術藍圖」指令時的 **指導原則**。您的任務是 **透過與使用者互動，收集資訊，然後再產出一個客製化的、完整的專案技術藍圖文件集**。

---

## 2. 生成流程 (Generation Process)

### **步驟一：互動式資訊收集 (Interactive Information Gathering)**

*   **觸發指令:** `AI plan blueprint`
*   **AI 行動宣告:**
    > **AI 必須回應:** "🤖 收到 `plan blueprint` 指令。現在啟動 **03 號框架：技術藍圖生成指南**。
    > **目前進入：步驟一 - 互動式資訊收集**。
    > 我將透過問答，與您確認專案的技術選型與開發規範。"
*   **提問清單 (Question Checklist):**
    1.  高層次架構 (High-Level Architecture)
    2.  前端技術棧 (Frontend Tech Stack)
    3.  後端技術棧 (Backend Tech Stack)
    4.  資料庫 (Database)
    5.  **開發規範 (Coding Standards):**
        *   **提問:** "關於開發規範，我們有以下選項：
            a) **基本規範套件**：程式碼風格、基本資安、效能監控
            b) **完整規範套件**：包含測試、部署、無障礙設計
            c) **企業級規範套件**：包含資安審計、效能優化、CI/CD
            d) **您提供現有規範文件路徑**，我會將它們整合到專案藍圖中
            e) **自訂規範組合**：根據專案需求選擇特定規範
            
            請問您希望採用哪種規範套件？我將根據您的選擇，生成對應的規範文件。"
    6.  **資安要求 (Security Requirements):**
        *   **提問:** "請問專案的資安等級要求是什麼？
            a) **基本資安**：HTTPS、輸入驗證、基本身份驗證
            b) **標準資安**：JWT、RBAC、資料加密、安全標頭
            c) **高級資安**：多因子認證、資安審計、滲透測試
            d) **企業級資安**：SOC2合規、GDPR合規、零信任架構"
    7.  **效能要求 (Performance Requirements):**
        *   **提問:** "請問專案的效能要求是什麼？
            a) **基本效能**：頁面載入 < 3秒，API回應 < 500ms
            b) **標準效能**：Core Web Vitals達標，API回應 < 200ms
            c) **高級效能**：LCP < 2.5s，FID < 100ms，99.9%可用性
            d) **企業級效能**：微服務架構、自動擴展、效能監控"
    8.  **部署策略 (Deployment Strategy):**
        *   **提問:** "請問專案的部署策略是什麼？（例如：手動部署、透過 GitHub Actions 自動化 CI/CD）。我將根據您的回答，生成 `docs/DEPLOYMENT_GUIDE.md`。"
    9.  **服務啟動路徑配置 (Service Startup Path Configuration):**
        *   **提問:** "為了避免AI在錯誤路徑啟動服務，請確認以下服務的啟動路徑：
            
            **請根據您選擇的技術棧，提供各服務的正確啟動指令：**
            
            a) **前端服務路徑與指令:** 
               - 工作目錄: (例如: `frontend/`, `client/`, `web/`)
               - 啟動指令: (例如: `npm run dev`, `yarn start`, `pnpm dev`, `ng serve`)
               - 預設端口: (例如: 3000, 4200, 8080)
            
            b) **後端服務路徑與指令:**
               - 工作目錄: (例如: `backend/`, `server/`, `api/`)
               - 啟動指令: (例如: `npm run start:dev`, `yarn dev`, `dotnet run`, `python app.py`)
               - 預設端口: (例如: 7001, 8000, 5000)
            
            c) **資料庫服務路徑與指令:**
               - 工作目錄: (例如: `./`, `database/`)
               - 啟動指令: (例如: `docker-compose up db`, `docker run postgres`, `mongod`)
               - 預設端口: (例如: 5432, 27017)
            
            d) **其他服務路徑與指令:**
               - 訊息佇列: (例如: `docker-compose up rabbitmq`, `redis-server`)
               - 快取服務: (例如: `docker-compose up redis`, `memcached`)
               - 監控服務: (例如: `docker-compose up prometheus`, `grafana`)
            
            請根據您的實際技術棧提供正確的路徑和啟動指令。"
    10. **開發環境驗證機制 (Development Environment Validation):**
        *   **提問:** "為了確保AI在正確路徑執行指令，我們需要建立路徑驗證機制：
            a) **自動路徑檢測:** 在啟動服務前檢查目錄結構
            b) **錯誤路徑警告:** 當AI嘗試在錯誤路徑執行時發出警告
            c) **標準化啟動指令:** 建立統一的服務啟動指令模板
            d) **故障排除指南:** 提供常見錯誤的解決方案
            
            請問您希望採用哪些驗證機制？"

### **步驟二：文件生成確認 (File Generation Confirmation)**

*   **觸發條件:** 完成步驟一的資訊收集。
*   **AI 行動宣告:**
    > **AI 必須回應:** "✅ **步驟一已完成。** 我將根據我們討論的結果，生成相關文件。"
*   在收集完資訊後，向使用者確認，並預告將生成 `PROJECT_BLUEPRINT.md` 以及 `docs/` 目錄下的所有規範文件 (或連結到您提供的現有文件)。

### **步驟三：產出文件集 (Generating the Document Set)**

*   **觸發條件:** 使用者確認同意生成。
*   **AI 行動宣告:**
    > **AI 必須回應:** "✅ 收到您的確認。**目前進入：步驟三 - 產出文件集**。正在生成所有藍圖與規範文件..."
*   **核心任務 (Core Tasks):**

    **1. 生成規範文件與目錄 (Generate Standard Documents & Directories):**
    *   **任務說明:** 根據使用者在步驟一中選擇的規範套件，生成對應的規範文件，並 **必須預先建立一個空的 `docs/tasks/` 目錄**。
    *   **規範套件對應的文件生成邏輯 (File Generation Logic for Coding Standards Packages):**
        *   **通用架構規範 (Universal Architecture Standards):** 以下兩個文件將 **不論選擇何種套件** 都會生成，其內容會根據使用者選擇的技術棧動態填充。
            ```
            docs/
            └── architecture/
                ├── DIRECTORY_STRUCTURE.md    # 系統目錄架構規範
                └── NAMING_CONVENTION.md      # 文件與資產命名規範
            ```

        **基本規範套件 (Basic Package):**
        ```
        docs/
        ├── frontend/CODING_STYLE.md          # 基本程式碼風格
        ├── backend/API_DESIGN.md             # RESTful API設計
        ├── database/DESIGN_PRINCIPLES.md     # 基本命名規範
        └── security/BASIC_SECURITY.md        # 基本資安措施
        ```

        **完整規範套件 (Complete Package):**
        ```
        docs/
        ├── [基本規範套件所有文件]
        ├── frontend/PERFORMANCE.md           # 前端效能優化
        ├── frontend/ACCESSIBILITY.md         # 無障礙設計指南
        ├── backend/TESTING.md                # 後端測試策略
        ├── performance/OPTIMIZATION.md       # 效能監控策略
        └── testing/TEST_STRATEGY.md         # 測試金字塔
        ```

        **企業級規範套件 (Enterprise Package):**
        ```
        docs/
        ├── [完整規範套件所有文件]
        ├── security/ENTERPRISE_SECURITY.md   # 企業級資安規範
        ├── performance/APM_GUIDE.md          # 應用效能監控
        ├── compliance/SOC2_GDPR.md           # 合規要求
        ├── deployment/KUBERNETES.md          # 容器化部署
        └── monitoring/ALERTING.md            # 監控告警
        ```

        **自訂規範組合 (Custom Package):**
        *   AI 根據使用者的具體需求，選擇性地生成相應的規範文件。
        *   必須在生成前與使用者確認每個文件的必要性。

    **2. 生成機器可讀設定檔 (`project.config.yaml`): [MANDATORY]**
    *   **任務說明:** 為了確保所有 Agent (前端/後端/測試) 對於關鍵變數有統一的認知，您必須在專案根目錄生成 `project.config.yaml`。
    *   **Schema 遵循 (Schema Compliance):** 生成的 YAML 檔案內容 **必須嚴格通過** `specs/project_config.schema.json` 的驗證。
    *   **必要欄位:** (請參考 Schema 定義)
        *   `project.meta`: 專案名稱、版本、描述。
        *   `project.tech_stack`: 前後端語言、框架版本、資料庫類型。
        *   `project.paths`: 關鍵目錄路徑 (docs_root, frontend_root, backend_root)。
        *   `project.conventions`: 命名規則 (files, classes, interfaces)。

    **3. 生成環境建置指南 (Generate Setup Guide):**
    *   **任務說明:** 根據使用者選擇的技術棧，並參考網路上的最佳實踐，生成 `docs/SETUP_GUIDE.md`。
    *   **內容要求:** 此文件必須包含一個動態生成的、基於藍圖的指南。
        1.  **查閱技術棧 (Consult Tech Stack):** AI 必須首先回顧在「步驟一：互動式資訊收集」中確定的前端與後端框架。
        2.  **確定原生指令 (Determine Native Commands):** 根據識別出的框架，AI 必須自主確定其官方推薦的專案初始化 CLI 指令。
        3.  **生成指南內容 (Generate Guide Content):** AI 需在 `SETUP_GUIDE.md` 中，強調使用這些原生 CLI 工具的重要性，並提供具體的、動態生成的指令範例，解釋各參數用途。**嚴禁**在指南中寫入與使用者所選技術棧無關的硬編碼指令。

    **3. 生成核心藍圖 (`PROJECT_BLUEPRINT.md`):**
    *   **任務說明:** 建立 `PROJECT_BLUEPRINT.md` 核心文件，將專案的所有面向整合在一起。
    *   **藍圖結構範本 (Blueprint Structure Template):**
        ```markdown
        # 專案藍圖 (Project Blueprint)

        **致 AI 模型：**
        
        本文件是此專案的 **唯一真相來源 (Single Source of Truth)** 與 **最高指導原則**。在執行任何開發任務 (`do task`) 或變更請求 (`change request`) 前，您 **必須** 優先讀取並遵循本文件的所有內容與連結，特別是「系統建置指南」與「文件映射地圖」。
        
        ---
        ## 1. 系統架構與技術棧
        *   ... (根據使用者回覆填寫)
        ---
        ## 2. 開發規範文件與其他文件的目錄結構
        *   ... (列出所有文件的目錄架構)
        ---
        ## 3. 需求與功能建置 (Feature-to-Document Map)
        *   (此處將根據 PROJECT_REQUIREMENTS.md 的史詩需求，生成相關的功能建置表格)
        ---
        ## 4. 開發環境建置指南 (Development Environment Setup Guide)
        *   (此處必須包含一個明確指向 `docs/SETUP_GUIDE.md` 的連結)
        ---
        ## 5. 服務啟動路徑配置 (Service Startup Path Configuration)
        *   (此處將包含所有服務的啟動路徑、指令和驗證機制)
        ---
        ## 6. 系統建置指南
        *   本章節定義了 AI 在執行開發任務時，必須遵循的核心流程、行為準則與管理辦法。
        ---
        ## 7. 文件映射地圖
        *   本章節作為專案的中央導航系統，提供所有關鍵規範、日誌與追蹤文件的路徑與核心職責說明。
        
        ```
    *   **藍圖填充步驟 (Blueprint Population Steps):**
        *   **A. 填寫基本資訊:** 根據步驟一的討論結果，填寫 `## 1. 系統架構` 與 `## 2. 開發規範文件...目錄結構`。
        *   **B. 連結開發環境建置指南:** 建立明確指向 `docs/SETUP_GUIDE.md` 的連結，並填寫至 `## 4. 開發環境建置指南`。
        *   **C. 生成服務啟動路徑配置:** **必須** 在 `## 5. 服務啟動路徑配置` 章節中，根據步驟一中收集的技術棧資訊，動態生成以下內容：
            *   **服務啟動路徑映射表:** 根據實際技術棧填充工作目錄、啟動指令、預設端口和驗證檔案
            *   **標準化啟動指令:** 根據實際包管理器和框架生成正確的啟動指令模板
            *   **路徑驗證機制:** 根據實際技術棧生成對應的驗證指令
            *   **故障排除指南:** 根據實際技術棧提供對應的錯誤解決方案
            
            **動態生成規則:**
            1. **前端技術棧映射:**
               - React/Next.js: `npm run dev` 或 `yarn dev`
               - Angular: `ng serve`
               - Vue: `npm run serve` 或 `yarn serve`
               - Svelte: `npm run dev`
            
            2. **後端技術棧映射:**
               - Node.js/NestJS: `npm run start:dev` 或 `yarn start:dev`
               - .NET Core: `dotnet run`
               - Python/Django: `python manage.py runserver`
               - Python/Flask: `python app.py` 或 `flask run`
               - Java/Spring: `./mvnw spring-boot:run`
               - Go: `go run main.go`
            
            3. **資料庫技術棧映射:**
               - PostgreSQL: `docker-compose up postgres` 或 `pg_ctl start`
               - MySQL: `docker-compose up mysql` 或 `mysql.server start`
               - MongoDB: `docker-compose up mongo` 或 `mongod`
               - Redis: `docker-compose up redis` 或 `redis-server`
            
            4. **包管理器映射:**
               - npm: `npm install` 和 `npm run [script]`
               - yarn: `yarn install` 和 `yarn [script]`
               - pnpm: `pnpm install` 和 `pnpm [script]`
               - .NET: `dotnet restore` 和 `dotnet run`
               - Python: `pip install -r requirements.txt` 和 `python [file]`
            
            5. **驗證檔案映射:**
               - Node.js 專案: `package.json`
               - .NET 專案: `*.csproj`
               - Python 專案: `requirements.txt` 或 `pyproject.toml`
               - Java 專案: `pom.xml` 或 `build.gradle`
               - Docker 專案: `docker-compose.yml` 或 `Dockerfile`
        *   **D. 建立系統建置指南:** **必須** 在 `## 6. 系統建置指南` 章節中，生成以下內容，作為 AI 在開發階段的核心行為準則：
            ```markdown
            本章節為 AI 在執行 `AI plan tasks` 和 `AI do task` 指令時，必須遵循的核心開發流程與行為準則。

            ### 5.1 任務規劃階段準則 (Task Planning Phase)
            *   **高難度任務拆解:** 這是由 `04_TaskCreation_Framework.md` 負責處理的任務規劃環節。當 AI 偵測到高難度任務時，應遵循該框架的指引進行拆解。

            ### 5.2 任務執行階段準則 (Task Execution Phase)
            *   **上下文情境載入 (Context Loading):** 在執行任何任務之前，AI **必須** 首先查閱 `docs/CHANGELOG.md` 文件，以了解先前已完成任務的成果摘要，獲取開發的上下文情境。
            *   **服務啟動路徑驗證 (Service Startup Path Validation):** 在執行任何涉及服務啟動的任務之前，AI **必須** 首先查閱 `PROJECT_BLUEPRINT.md` 中的「服務啟動路徑配置」章節，確保在正確的目錄中執行正確的指令。
            *   **執行順序與依賴性檢查 (Execution Order & Dependency Check):** AI **必須** 嚴格遵循 `docs/TODO.md` 文件中由上到下的任務排列順序。在執行選定的任務 (Task-ID) 之前，AI **必須** 先查閱其對應的 `docs/tasks/[Task-ID].md` 文件，檢查其依賴項。只有當所有依賴項在 `docs/TODO.md` 中的狀態皆為 `✅ completed` 時，才可繼續執行此任務。
            *   **任務生命週期管理 (Task Lifecycle Management):** AI 執行任務時，必須遵循一個嚴格的、包含狀態更新的生命週期。
                *   **工具使用與備援原則 (Tool Usage & Fallback Principle):** 針對狀態更新，AI應優先使用專用工具 `todo_write`。若 `todo_write` 執行失敗，**必須** 自動嘗試使用通用工具 `edit_file` 完成相同的操作，以確保流程的健壯性。
                *   **啟動任務 (Task Initiation):** 當收到 `AI do task [Task-ID]` 指令後，AI 的**首要行動**必須是將 `docs/TODO.md` 中對應任務的狀態更新為 `🔵 in_progress`。此操作需遵循工具備援原則。
                *   **執行任務 (Task Execution):**
                    *   **待辦清單即時更新 (Checklist Real-time Update):** AI 每完成一項 `開發待辦清單` 中的具體步驟，都**必須立即**使用 `edit_file` 工具編輯對應的 `docs/tasks/[Task-ID].md` 文件，將該項目的 `[ ]` 更新為 `[x]`，以提供即時的進度追蹤。
                    *   **服務啟動路徑驗證 (Service Startup Path Validation):** 在執行任何服務啟動指令前，AI **必須** 執行以下驗證步驟：
                        1. **檢查工作目錄:** 確認當前工作目錄是否為專案根目錄
                        2. **驗證目標路徑:** 檢查目標服務目錄是否存在且包含必要檔案
                        3. **檢查依賴檔案:** 確認 `package.json` 或 `docker-compose.yml` 等必要檔案存在
                        4. **報告驗證結果:** 向使用者報告驗證結果，包括路徑狀態和可執行的指令
                    *   AI 根據任務文件的 `開發待辦清單`，依序執行所有開發活動。
                    *   **環境/套件變更綁定:** 在此階段，任何透過 `run_terminal_cmd` 指令執行的、會影響專案環境或依賴的變更，都**必須**伴隨著對相關配置文件 (`package.json`, `docs/SETUP_GUIDE.md` 等) 的更新。
                    *   **禁止不報告的行動:** 嚴禁 AI 執行任何會影響專案狀態的修改，卻沒有在 `docs/TODO.md` 或對話中留下可追蹤的紀錄。
                *   **驗收標準驗證與報告 (Acceptance Criteria Verification & Reporting):** 在所有開發步驟完成後，但在宣告任務完成前，AI **必須** 進入此驗證階段。
                    *   **逐項驗證:** AI 必須遍歷 `docs/tasks/[Task-ID].md` 文件中的每一條 `驗收標準`。
                    *   **執行驗證指令:** 對於每一條標準，AI 需執行一個或多個終端機指令（如 `ls`, `cat`, `curl`, `psql`）來獲取客觀的、可證實的結果。
                    *   **提供證據並報告:** AI **必須** 在對話中展示它所使用的指令、指令的完整輸出，並明確報告驗證結果：
                        *   **成功:** `✅ [標準描述] - 驗證成功。` (並附上指令與輸出證據)
                        *   **失敗:** `❌ [標準描述] - 驗證失敗。` (並附上指令、錯誤訊息或非預期輸出)
                    *   **更新驗收清單:** 只有在對應的標準被成功驗證後，AI 才可以使用 `edit_file` 工具將該驗收標準的 `[ ]` 更新為 `[x]`。
                    *   **失敗即停止:** 如果任何一條驗收標準驗證失敗，AI **必須** 停止執行，並向使用者報告問題，請求進一步指示。
                *   **移交審查 (Handoff to QA):** 當任務的所有開發步驟都執行完畢，**且所有驗收標準都已成功驗證並報告後**，開發代理的職責即告完成。它 **必須** 向主 AI (Orchestrator) 回報任務已準備好進入審查階段。
                    *   **回報格式:** `"✅ 開發任務 [Task-ID] 已完成，所有驗收標準均已通過驗證。現移交進行程式碼審查。"`
            *   **程式碼審查階段 (Code Review Phase):**
                *   **自動觸發:** 主 AI (Orchestrator) 在收到開發代理的完成回報後，**必須立即且自動地** 指派 `QA-Sam` (或任何 `role` 為 "QA" 的代理) 執行審查。
                *   **審查執行:** `QA-Sam` 代理根據 `PROJECT_BLUEPRINT.md` 和 `06_DevelopmentStandards_Guide.md` 進行審查，並向主 AI 回報審查結果 (`通過` 或 `失敗`，並附上報告)。
            *   **完成任務 (Task Completion):** 主 AI 在收到 `QA-Sam` **肯定的「審查通過」報告** 後，才可執行此最終步驟。這 **必須** 是一個包含以下所有操作的原子性更新：
                    1.  **更新任務狀態與依賴:**
                        *   使用 `todo_write` (或 `edit_file` 作為備援) 將 `docs/TODO.md` 中當前任務的狀態更新為 `✅ completed`。
                        *   同時，**必須** 檢查 `docs/TODO.md` 中所有其他任務，將所有依賴於剛剛完成任務的 `🚧 blocked` 任務，其狀態更新為 `⚪️ pending`。
                    2.  **追加變更日誌:** 使用 `edit_file` 在 `docs/CHANGELOG.md` 文件的最頂部，追加一個新的「任務摘要報告」。報告格式如下：
                        ```markdown
                        ---
                        ### Task-ID: `[已完成的任務ID]`
                        *   **完成日期:** YYYY-MM-DD
                        *   **核心變更檔案:** 
                            *   `path/to/file1.ts`
                            *   `path/to/file2.html`
                        *   **成果摘要:** 簡要說明此任務達成的成果。
                        ```
                    3.  **回報與建議:** 向使用者回報，格式如下：`✅ 任務 [Task-ID] 已完成。根據 docs/TODO.md 的排序，下一個建議執行的任務是 [Next-Task-ID]。`
            *   **動態任務拆解 (Dynamic Task Decomposition):** 當接收到 `AI decompose task [Task-ID]` 指令時，AI **必須** 暫停當前所有活動，並嚴格遵循 **`AI專案開發指南/04_TaskCreation_Framework.md`** 文件中 `Phase 4: 交付與可選拆解` 章節定義的完整執行邏輯。完成拆解與文件生成後，再根據 `docs/TODO.md` 的新順序向使用者建議下一個任務。

            ### 5.3 需求變更管理 (Change Request Management)
            *   **變更請求指令:** 當使用者需要變更、增加或刪除功能時，請下達 `AI change request "[您的具體需求]"` 指令。
            *   **影響性分析:** AI 接收到指令後，**必須** 進行影響性分析，並向使用者報告將被修改的文件清單 (包含但不限於 `PROJECT_REQUIREMENTS.md`, `PROJECT_BLUEPRINT.md`, `docs/TODO.md`, 以及相關的 `docs/tasks/` 文件)。
            *   **使用者批准:** 只有在獲得使用者明確批准後，AI 才可執行變更。
            ```
        *   **E. 建立文件路徑地圖:** **必須** 在 `## 7. 文件映射地圖` 章節中，生成「文件地圖」表格。此地圖除了包含所有已生成的規範文件外，**必須預先包含以下五項，為後續的任務規劃做好準備**:
            | 文件 (Document)       | 核心職責 (Core Responsibility)               | 路徑 (Path)                                |
            | :-------------------- | :------------------------------------------- | :----------------------------------------- |
            | **專案任務看板**      | 追蹤所有開發任務的狀態、優先級與依賴關係。 | `docs/TODO.md`                             |
            | **任務詳情目錄**      | 存放所有獨立任務的詳細規格文件。             | `docs/tasks/`                              |
            | **變更日誌**          | 記錄所有已完成任務的摘要報告。               | `docs/CHANGELOG.md`                        |
            | **目錄架構規範**      | **[動態生成]** 定義專案的完整源碼目錄結構。  | `docs/architecture/DIRECTORY_STRUCTURE.md` |
            | **命名規範**          | **[動態生成]** 定義所有文件與資產的命名規則。| `docs/architecture/NAMING_CONVENTION.md`   |
        *   **F. 生成需求與功能建置表:** 在 `## 3. 需求與功能建置` 章節中，生成完整的「需求與文件映射地圖」。
            *   **生成規則 (Generation Rules):**
                1.  **功能需求提取:** 從 `PROJECT_REQUIREMENTS.md` 中提取所有史詩(Epics)和使用者故事(User Stories)。
                2.  **規範文件映射:** 為每個功能需求分配對應的規範文件。
                3.  **生成映射表格:** 建立完整的功能需求與規範文件映射表格。
            *   **生成範例 (Generation Example):**
                ```markdown
                | 功能需求 | 對應規範文件 | 具體要求 | 優先級 |
                |---------|-------------|----------|--------|
                | 用戶註冊 | frontend/CODING_STYLE.md | 表單驗證、錯誤處理 | 高 |
                | 用戶註冊 | backend/API_DESIGN.md | RESTful API設計 | 高 |
                | 用戶註冊 | security/BASIC_SECURITY.md | 密碼加密、輸入驗證 | 高 |
                | 用戶註冊 | database/DESIGN_PRINCIPLES.md | 用戶資料表設計 | 高 |
                | 創建爬蟲任務 | frontend/CODING_STYLE.md | 任務配置介面 | 高 |
                | 創建爬蟲任務 | backend/API_DESIGN.md | 任務管理API | 高 |
                | 創建爬蟲任務 | performance/OPTIMIZATION.md | 非同步處理 | 中 |
                | 資料清洗 | backend/TESTING.md | 資料驗證測試 | 中 |
                | 資料清洗 | database/DESIGN_PRINCIPLES.md | 資料庫設計 | 中 |
                | 資料視覺化 | frontend/PERFORMANCE.md | 圖表效能優化 | 低 |
                | 資料視覺化 | frontend/ACCESSIBILITY.md | 無障礙圖表 | 低 |
                ```
            *   **完整性檢查 (Integrity Checks):**
                1.  **功能需求完整性**：所有從 `PROJECT_REQUIREMENTS.md` 提取的功能需求都必須出現在映射表格中。
                2.  **規範文件完整性**：所有生成的規範文件都必須至少對應一個功能需求。
                3.  **映射關係實用性**：每個映射關係都必須具體且實用，不能是泛泛而談。
                4.  **優先級合理性**：根據功能的重要性和複雜度分配合理的優先級。

*   **階段完成與行動指引:**
    > **當文件集生成完畢後，AI 必須回應:** "✅ **步驟三已完成。** 所有技術藍圖與規範文件皆已生成。
    > **接下來，您可以：**
    >  * **啟動 UI/UX 設計:** 請下達指令 `AI design ui`"
