# 05_程式碼庫同化與重構框架 (Codebase Assimilation & Refactoring Framework)

---

## 1. 目的與適用場景

本文件旨在定義一套高階的 **「逆向工程」** 工作流程。其核心是指導 AI 如何 **學習** 一個現有的、作為參考的程式碼庫（參考專案），從中 **提煉** 出其內在的架構與規範，並將這些規範 **應用** 到一個新的開發或既有的重構任務上（目標專案）。

此框架適用於以下場景：
*   當需要基於一個優秀的既有專案，來開啟一個風格一致的新專案時。
*   當需要將一個舊的、風格不一的專案，統一重構成為與參考專案一致的樣式時。

---

## 2. 執行流程 (Execution Flow)

此框架分為三個階段：**同化 (Assimilate)** -> **蒸餾 (Distill)** -> **應用 (Apply)**。

### Phase 1: 程式碼庫同化 (Codebase Assimilation) - 「學習」階段

*   **目的:** 讓 AI 深入學習您所提供的參考專案。
*   **觸發指令:**
    > `AI assimilate from <參考專案的路徑>`
*   **AI 行動宣告:**
    > **AI 必須回應:** "🤖 收到 `assimilate` 指令。現在啟動 **05 號框架：程式碼庫同化與重構**。
    > **目前進入：Phase 1 - 程式碼庫同化**。
    > 我將開始掃描與分析 `<參考專案的路徑>`..."
*   **AI 任務:**
    1.  **掃描與分析:** AI 將遞迴地掃描指定的 `<參考專案的路徑>`，並 **優先分析** 以下項目：
        *   **技術棧與環境 (Tech Stack & Environment):** **此為首要分析任務。** 透過檢查關鍵檔案 (`package.json`, `.csproj`, `sln`, `pom.xml`, `angular.json`, `docker-compose.yml` 等)，識別出專案的前後端框架、主要語言、環境，**以及關鍵的建置 (`build`) 與測試 (`test`) 指令**。如果無法明確判斷，**必須** 向使用者提問。
        *   **目錄結構與檔案構成模式 (Directory Structure & File Schema):** **必須**識別出構成一個完整邏輯單元（如一個 Angular 元件）的所有檔案集合與其命名規則。例如，一個元件是否固定由 `.ts`, `.html`, `.scss`, 和 `.spec.ts` 四個檔案組成。
        *   **變數與函式的命名規範**
        *   **程式碼的編寫風格**
        *   **API 的設計規範** (透過分析服務層與網路請求推斷)
    2.  **提交分析報告:** 在分析完成後，AI **必須** 向使用者提交一份 **「同化分析報告」**，以簡潔的條列式風格，總結其觀察到的模式，並徵求使用者確認。

*   **範例 (Example):**
    > **您:** `AI assimilate from /path/to/GoodProject`
    >
    > **AI:** "🤖 我已完成對 `/path/to/GoodProject` 的分析。觀察到以下模式：
    > *   **偵測到的技術棧:** 前端為 **Angular v17+** (Standalone Components)，後端為 **ASP.NET Core**。
    > *   **關鍵指令 (Key Commands):** 建置指令為 `ng build`，測試指令為 `ng test` (從 `package.json` 和 `angular.json` 中識別)。
    > *   **檔案構成模式 (File Schema):** 每個 Angular 元件都由 **4 個檔案** 組成：`[name].component.ts`, `[name].component.html`, `[name].component.scss`, 和 `[name].component.spec.ts`。所有檔案皆使用 `kebab-case` 命名。
    > *   **目錄結構:** 採用 `features -> components/services/models` 的分層。
    > *   **後端 API:** 路由包含 `/api/v1/` 前綴，回應格式為 `{ "success": true/false, "data": ... }`。
    > *   **編碼風格:** Class 中的 `public` 方法宣告在 `private` 方法之前。
    >
    > 請問我的觀察是否正確？是否可以基於這些模式，生成新的開發規範文件？"

### Phase 2: 模式蒸餾 (Pattern Distillation) - 「產出規範」階段

*   **目的:** 將 AI 在第一階段學到的「隱性知識」，轉化為我們框架看得懂的「顯性文件」。
*   **觸發條件:** 使用者確認「同化分析報告」的內容無誤。
*   **AI 行動宣告:**
    > **AI 必須回應:** "✅ **Phase 1 已完成。** 您的觀察已確認。
    > **目前進入：Phase 2 - 模式蒸餾**。
    > 我將開始生成客製化的藍圖與規範文件..."
*   **AI 任務:**
    1.  **生成客製化規範:** AI 將根據分析結果，自動生成或覆寫 `docs/` 目錄下的所有規範文件 (`CODING_STYLE.md`, `API_DESIGN.md` 等)。
    2.  **生成客製化藍圖:** AI **必須** 生成一份全新的 `PROJECT_BLUEPRINT.md`。此文件的「文件地圖」章節 **必須** 以表格形式呈現，並包含 `文件`、`核心職責`、`路徑` 三個欄位，清晰地解釋每一份規範文件的用途。

*   **範例 (Example):**
    > **您:** "觀察正確，請繼續。"
    >
    > **AI:** "✅ 收到。我現在將根據分析結果，生成客製化文件。
    >
    > 其中，`PROJECT_BLUEPRINT.md` 中將包含一份如下所示的「文件地圖」，解釋每個規範檔案的用途：
    >
    > | 文件 (Document) | 核心職責 (Core Responsibility) | 路徑 (Path) |
    > | :--- | :--- | :--- |
    > | **前端開發規範** | 定義元件/服務的命名、非同步處理(`rxjs`)、程式碼風格等。 | `docs/frontend/CODING_STYLE.md` |
    > | **後端 API 設計** | 定義 API 路由結構、請求/回應的 JSON 格式、錯誤碼等。| `docs/backend/API_DESIGN.md` |
    > | **部署指南** | 說明手動部署或 CI/CD 流程的步驟。| `docs/DEPLOYMENT_GUIDE.md` |
    >
    > 我將開始生成 `PROJECT_BLUEPRINT.md` 以及上述所有相關的 `docs` 文件。完成後會再向您報告。"
*   **階段完成與行動指引:**
    > **AI 必須回應:** "✅ **Phase 2 已完成。** 客製化的 `PROJECT_BLUEPRINT.md` (包含詳細的文件地圖) 與相關規範文件已生成。
    > **接下來，您可以選擇：**
    >   a) **開發新功能:** 請下達指令 `AI plan tasks`
    >   b) **重構現有程式碼:** 請下達指令 `AI refactor <path> to match blueprint`
    >
    > 請問您希望進行哪一步？"

### Phase 3: 規範應用 (Guideline Application) - 「執行」階段

*   **目的:** 將新生成的規範應用到實際工作中。
*   **觸發條件:** 第二階段完成後，根據使用者的下一步指令。
*   **此階段有兩個主要路徑：**

    **A) 開發新功能:**
    *   **使用者指令:** `AI plan tasks`
    *   **AI 行動:** AI 將遵循 `04_TaskCreation_Framework.md` 的流程，但其所有行動的依據，都將是 Phase 2 生成的 **客製化 `PROJECT_BLUEPRINT.md`**。
    *   **範例:**
        > **您:** `AI plan tasks`
        >
        > **AI:** "✅ 好的。我將依據剛剛從 `GoodProject` 學習到的規範來規劃開發任務。所有新產出的前端檔案將遵循 `kebab-case` 命名，所有新的後端 API 將回傳 `{ success: ..., data: ... }` 格式。"

    **B) 重構現有程式碼:**
    *   **使用者指令:**
        > `AI refactor <目標專案的路徑> to match blueprint`
    *   **AI 行動:**
        1.  **載入目標藍圖:** 將 Phase 2 生成的客製化藍圖作為「正確的標準」。
        2.  **比較與分析:** 掃描 `<目標專案的路徑>`，並與目標藍圖進行比較。
        3.  **提交重構計畫:** **必須** 向使用者提交一份詳細的 **「重構計畫」**，列出預計的檔案變更、程式碼修改等，並徵求使用者批准。
        4.  **安全提示:** 在提交計畫時，**必須** 提醒使用者：「建議在新的 Git 分支上執行此重構任務，以確保所有變更皆可控。」
        5.  **執行與驗證 (Execute & Verify):**
            *   在使用者批准後，開始執行重構任務。
            *   **大文件拆分處理:** 如果遇到超過 300 行的大文件，**必須** 採用以下拆分策略：
                *   **Extract Method:** 將重複或複雜的邏輯提取為獨立方法
                *   **Extract Class:** 將多職責類別拆分為單一職責類別
                *   **Extract Module:** 將相關功能組織為獨立模組
                *   **依賴分析:** 確保拆分後不破壞現有依賴鏈
            *   重構完成後，**必須** 立即啟動「自動化驗證流程」。
            *   **驗證流程:**
                *   **A. 重新編譯:** 執行在 Phase 1 學習到的建置指令 (例如: `ng build`)。
                *   **B. 執行測試:** 執行在 Phase 1 學習到的測試指令 (例如: `ng test --watch=false --browsers=ChromeHeadless`)。
        6.  **提交驗證報告 (Submit Verification Report):** AI **必須** 根據驗證結果，向使用者提交最終報告。
    *   **範例:**
        > **您:** `AI refactor /path/to/OldProject to match blueprint`
        >
        > **AI:** "🤖 遵命。在比較 `OldProject` 與新藍圖後，我建議執行以下重構計畫：
        > *   **檔案重新命名 (8個檔案):** 例如，將 `UserProfile.component.ts` 更名為 `user-profile.component.ts`。
        > *   **目錄結構調整:** 將 `/services` 目錄移動至 `/core/services` 下。
        > *   **大文件拆分:** 發現 `worker-consultation-management.component.ts` (981行) 需要拆分：
        >     *   提取 `ConsultationRecordService` 類別處理諮詢紀錄邏輯
        >     *   提取 `ServiceReferralService` 類別處理服務轉介邏輯
        >     *   提取 `JobAssessmentService` 類別處理配工評估邏輯
        >     *   創建對應的 `.scss` 和 `.spec.ts` 檔案
        > *   **程式碼修改 (25個檔案):** 將 25 個 Controller 中的 API 回應格式，從 `{ "status": "ok", "result": ... }` 修改為 `{ "success": true, "data": ... }`。
        >
        > 💡 **安全提示：** 建議在新的 Git 分支上執行此重構任務，以確保所有變更皆可控。
        >
        > **計畫執行完畢後，我將會自動執行 `ng build` 和 `ng test` 指令來驗證重構的正確性，並向您報告結果。**
        >
        > 請問是否批准此計畫並開始執行？"
    *   **階段完成宣告 (Scenarios):**
        > **[情境一：重構成功]**
        > **當所有重構任務執行完畢，且通過自動化驗證後，AI 必須回應:** "✅ **重構成功，且通過自動化驗證。**
        > *   **編譯結果:** 成功。
        > *   **測試結果:** 全部測試通過。
        > 我們的專案現在已與最新的藍圖保持一致，且核心功能穩定。建議您檢視 Git 分支中的變更。"
        >
        > **[情境二：重構失敗]**
        > **當自動化驗證失敗時，AI 必須立即停止並回應:** "🚨 **重構失敗，未通過自動化驗證。**
        > *   **執行階段:** 編譯失敗 (或 測試失敗)。
        > *   **錯誤日誌:**
        >   ```
        >   [此處貼上詳細的終端機錯誤訊息]
        >   ```
        > **重構已停止。** 為避免破壞專案，所有變更已保留在當前 Git 分支。請檢視錯誤並提供下一步指示。" 

---

## 3. 結論 
