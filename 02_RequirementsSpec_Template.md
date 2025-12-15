# 02_需求規格範本 (Requirements Specification Template)

---

## 1. 目的與 AI 指令 (Purpose & AI Instructions)

**致 AI 模型：**

本文件是您在 **探詢使用者需求** 及 **生成 `PROJECT_REQUIREMENTS.md` 文件** 時，必須嚴格遵循的 **內容結構與格式範本**。

---

## 2. 需求文件結構 (Structure)

*   **專案總覽 (Project Overview)**
    *   專案名稱 (Project Name): *範例：企業員工心理健康諮商平台*
    *   專案背景 (Background): *範例：為了解決現代職場壓力問題，提供員工一個保密的諮商管道。*
    *   核心目標 (Goals / Objectives): *範例：目標一：提升員工幸福感...*
    *   範圍定義 (Scope Definition): *範例：範圍內：線上預約、匿名統計...*
*   **使用者角色 (User Personas)**
    *   角色一：*範例：平台管理員*
        *   描述: *範例：負責系統的日常維護與使用者權限管理。*
*   **資訊架構與頁面規劃 (Information Architecture & Page Layout)**
    *   網站地圖 (Sitemap): *使用巢狀列表呈現網站的完整頁面層級結構。*
        *   *範例:*
            *   *首頁*
            *   *關於我們*
            *   *服務項目*
                *   *服務一*
                *   *服務二*
            *   *聯絡我們*
            *   *會員專區 (需登入)*
                *   *個人資料*
                *   *訂單紀錄*
    *   核心頁面元件 (Key Page Components): *條列出主要頁面上應包含的功能區塊或元件。*
        *   *範例：首頁 (Homepage)*
            *   *主要導覽列 (Main Navigation)*
            *   *英雄區塊 (Hero Section) with Call-to-Action*
            *   *服務特色介紹*
            *   *客戶見證輪播*
            *   *頁尾 (Footer)*
*   **功能史詩與使用者故事 (Epics & User Stories)**
    *   史詩 (Epic): *範例：使用者身份驗證管理*
    *   使用者故事 (User Story)
        *   原文 (As a ..., I want to ..., so that ...): *範例：身為一位 **新訪客**，我想要 **能夠註冊帳號**，以便 **存取會員功能**。*
        *   **驗收標準 (Acceptance Criteria):**
            ```gherkin
            # 場景一：成功註冊
            Given 我是一位未註冊的新訪客
            When 我進入註冊頁面
            Then 系統應該為我建立一個新的使用者帳號
            ```
*   **非功能性需求 (Non-Functional Requirements)**
    *   效能 (Performance): *範例：所有頁面載入時間應在 3 秒內完成。*
*   **資料模型 (Data Model)**
    *   實體：User (使用者): *範例：id (PK), email (UNIQUE), password_hash*
*   **API 規格 (API Specification)**
    *   端點：使用者註冊: *範例：POST /api/users/register* 