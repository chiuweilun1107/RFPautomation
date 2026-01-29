# 圖片儲存架構圖集

**用途**: 視覺化系統架構與決策流程
**格式**: Mermaid Diagrams (可在 GitHub/GitLab/Notion 直接渲染)
**更新日期**: 2026-01-29

---

## 1. 現狀架構圖 (Current Architecture)

```mermaid
graph TB
    subgraph "Frontend Layer"
        A1[UploadZone<br/>文件上傳]
        A2[ImageGenerationDialog<br/>AI 圖片生成]
        A3[OnlyOfficeEditor<br/>文件編輯器]
        A4[TemplateDesigner<br/>模板設計]
    end

    subgraph "API Layer"
        B1[/api/sources/create]
        B2[/api/projects/images/generate]
        B3[/api/onlyoffice-callback]
        B4[/api/templates/parse]
    end

    subgraph "Storage Layer - Supabase"
        C1[(raw-files Bucket)]
        C2[Cloudflare CDN<br/>275+ 節點]
        C3[(PostgreSQL)]
    end

    subgraph "Database Tables"
        D1[sources<br/>origin_url]
        D2[task_images<br/>image_url]
        D3[templates<br/>parsed_images]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4

    B1 --> C1
    B2 --> C1
    B3 --> C1
    B4 --> C1

    C1 --> C2
    C1 --> C3

    C3 --> D1
    C3 --> D2
    C3 --> D3

    style C1 fill:#4CAF50,color:#fff
    style C2 fill:#2196F3,color:#fff
    style C3 fill:#4CAF50,color:#fff
```

---

## 2. 優化後架構圖 (Optimized Architecture)

```mermaid
graph TB
    subgraph "Frontend Layer with Compression"
        A1["UploadZone<br/>+ Sharp.js 壓縮<br/>Quality: 80%"]
        A2["ImageGenerationDialog<br/>+ 自動壓縮<br/>Max: 1920px"]
        A3["OnlyOfficeEditor<br/>+ Smart Cache"]
        A4["TemplateDesigner<br/>+ Lazy Loading"]
    end

    subgraph "Compression Pipeline"
        B1[Sharp.js]
        B2[isImageFile?]
        B3[compressImage]
        B4[Size: 500KB → 200KB<br/>-60%]
    end

    subgraph "Storage Layer - Optimized"
        C1["raw-files Bucket<br/>✅ Cache-Control: 1 year"]
        C2["Cloudflare CDN<br/>✅ Hit Rate: 95%+"]
        C3[(PostgreSQL)]
    end

    subgraph "Monitoring Layer NEW"
        E1[Storage Monitor<br/>用量儀表板]
        E2[Alerts<br/>⚠️ > 80% 告警]
        E3[Performance<br/>Sentry Web Vitals]
    end

    A1 --> B2
    A2 --> B2
    B2 -->|是圖片| B3
    B2 -->|非圖片| C1
    B3 --> B1
    B1 --> B4
    B4 --> C1

    C1 --> C2
    C1 --> C3

    C3 --> E1
    E1 --> E2
    C2 --> E3

    style B1 fill:#FF9800,color:#fff
    style C1 fill:#4CAF50,color:#fff
    style C2 fill:#2196F3,color:#fff
    style E1 fill:#9C27B0,color:#fff
    style E2 fill:#F44336,color:#fff
```

---

## 3. 方案對比流程圖 (Solution Comparison)

```mermaid
graph LR
    A[圖片儲存需求] --> B{評估方案}

    B --> C[方案 A:<br/>Supabase Storage]
    B --> D[方案 B:<br/>Cloudinary]
    B --> E[方案 C:<br/>混合架構]
    B --> F[方案 D:<br/>自建 MinIO]

    C --> C1[✅ 優勢]
    C1 --> C1a[零遷移成本]
    C1 --> C1b[統一管理]
    C1 --> C1c[RLS 安全]
    C1 --> C1d[成本可預測]

    C --> C2[❌ 劣勢]
    C2 --> C2a[無進階處理]
    C2 --> C2b[CDN 覆蓋較少]

    D --> D1[✅ 優勢]
    D1 --> D1a[專業 CDN]
    D1 --> D1b[自動優化]
    D1 --> D1c[AI 功能]

    D --> D2[❌ 劣勢]
    D2 --> D2a[遷移成本高]
    D2 --> D2b[認證複雜]
    D2 --> D2c[成本不確定]

    E --> E1[❌ 劣勢]
    E1 --> E1a[複雜度暴增]
    E1 --> E1b[維護負擔高]
    E1 --> E1c[成本疊加]

    F --> F1[❌ 劣勢]
    F1 --> F1a[維護極高]
    F1 --> F1b[無 CDN]
    F1 --> F1c[安全風險]

    C --> G{決策}
    D --> G
    E --> G
    F --> G

    G -->|TCO 最低| H[✅ 選擇方案 A]

    style C fill:#4CAF50,color:#fff
    style H fill:#4CAF50,color:#fff
    style D fill:#FFC107,color:#000
    style E fill:#F44336,color:#fff
    style F fill:#F44336,color:#fff
```

---

## 4. 決策流程圖 (Decision Flow)

```mermaid
flowchart TD
    Start([開始評估]) --> Check1{儲存用量<br/> < 80GB?}

    Check1 -->|YES| Check2{頻寬用量<br/> < 200GB/月?}
    Check1 -->|NO| Alert1[🔴 儲存超標]

    Check2 -->|YES| Check3{效能 P95<br/> < 2s?}
    Check2 -->|NO| Alert2[🔴 頻寬超標]

    Check3 -->|YES| Check4{用戶投訴<br/> < 5次/週?}
    Check3 -->|NO| Alert3[🟡 效能問題]

    Check4 -->|YES| Check5{新功能需求<br/>AI 處理?}
    Check4 -->|NO| Alert4[🟡 用戶不滿]

    Check5 -->|YES| Evaluate[進入評估流程]
    Check5 -->|NO| Maintain[✅ 維持 Supabase]

    Alert1 --> Evaluate
    Alert2 --> Evaluate
    Alert3 --> Evaluate
    Alert4 --> Evaluate

    Evaluate --> Calc1[計算 ROI]
    Calc1 --> Calc2[計算遷移成本]
    Calc2 --> Calc3[比較 TCO]

    Calc3 --> Decision{ROI > 2x<br/>遷移成本?}

    Decision -->|YES| Migrate[🟢 執行遷移<br/>至 Cloudinary]
    Decision -->|NO| Optimize[🔴 暫緩遷移<br/>優化現狀]

    Maintain --> Schedule[📅 6個月後<br/>重新評估]
    Optimize --> Schedule
    Migrate --> Monitor[📊 監控成本<br/>與效能]

    style Maintain fill:#4CAF50,color:#fff
    style Migrate fill:#FF9800,color:#fff
    style Optimize fill:#2196F3,color:#fff
    style Alert1 fill:#F44336,color:#fff
    style Alert2 fill:#F44336,color:#fff
    style Alert3 fill:#FFC107,color:#000
    style Alert4 fill:#FFC107,color:#000
```

---

## 5. 成本趨勢圖 (Cost Trend)

```mermaid
graph LR
    subgraph "成本對比 (月費)"
        A1[當前]
        A2[6個月]
        A3[12個月]
        A4[24個月]
    end

    subgraph "Supabase"
        B1[$0.36]
        B2[$1.91]
        B3[$25]
        B4[$25]
    end

    subgraph "Cloudinary"
        C1[$3.18]
        C2[$5.98]
        C3[$27.48]
        C4[$85.48]
    end

    subgraph "自建 MinIO"
        D1[$200]
        D2[$200]
        D3[$200]
        D4[$200]
    end

    A1 --> B1
    A1 --> C1
    A1 --> D1

    A2 --> B2
    A2 --> C2
    A2 --> D2

    A3 --> B3
    A3 --> C3
    A3 --> D3

    A4 --> B4
    A4 --> C4
    A4 --> D4

    style B1 fill:#4CAF50,color:#fff
    style B2 fill:#4CAF50,color:#fff
    style B3 fill:#4CAF50,color:#fff
    style B4 fill:#4CAF50,color:#fff
    style C4 fill:#F44336,color:#fff
    style D1 fill:#F44336,color:#fff
    style D4 fill:#F44336,color:#fff
```

---

## 6. 資料流圖 (Data Flow)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant Comp as Sharp.js
    participant SB as Supabase Storage
    participant CDN as Cloudflare CDN
    participant DB as PostgreSQL

    Note over U,DB: 圖片上傳流程 (優化後)

    U->>FE: 上傳圖片 (500KB)
    FE->>FE: 檢查是否為圖片
    FE->>Comp: compressImage()
    Comp->>Comp: Resize + Compress
    Comp->>FE: 返回壓縮檔 (200KB, -60%)

    FE->>SB: 上傳至 raw-files
    SB->>SB: 設定 cache-control: 1 year
    SB->>DB: 儲存 URL 到 task_images
    DB-->>FE: 返回圖片 ID

    Note over U,DB: 圖片載入流程

    U->>FE: 瀏覽專案
    FE->>CDN: 請求圖片 (第一次)
    CDN->>SB: CDN MISS, 從 Origin 取得
    SB-->>CDN: 返回圖片 (200KB)
    CDN-->>FE: cf-cache-status: MISS
    FE-->>U: 顯示圖片 (~1.2s)

    U->>FE: 再次瀏覽 (重新載入)
    FE->>CDN: 請求相同圖片
    CDN-->>FE: CDN HIT, 直接返回
    CDN-->>FE: cf-cache-status: HIT
    FE-->>U: 顯示圖片 (~50ms)
```

---

## 7. 部署架構圖 (Deployment Architecture)

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Frontend (Vercel/Hetzner)"
            A1[Next.js App]
            A2[Sharp.js Runtime]
        end

        subgraph "Supabase Cloud"
            B1[Storage Bucket<br/>raw-files]
            B2[PostgreSQL]
            B3[Storage API]
        end

        subgraph "Cloudflare Network"
            C1[Edge CDN<br/>Node 1]
            C2[Edge CDN<br/>Node 2]
            C3[Edge CDN<br/>Node N]
        end

        subgraph "Monitoring"
            D1[Supabase Dashboard]
            D2[Sentry Performance]
            D3[Custom Monitor]
        end
    end

    subgraph "Users"
        E1[台灣用戶]
        E2[美國用戶]
        E3[歐洲用戶]
    end

    A1 --> B3
    A2 --> B3
    B3 --> B1
    B1 --> C1
    B1 --> C2
    B1 --> C3

    E1 --> C1
    E2 --> C2
    E3 --> C3

    B1 --> D1
    B2 --> D1
    C1 --> D2
    B2 --> D3

    style B1 fill:#4CAF50,color:#fff
    style B2 fill:#4CAF50,color:#fff
    style C1 fill:#2196F3,color:#fff
    style C2 fill:#2196F3,color:#fff
    style C3 fill:#2196F3,color:#fff
```

---

## 8. 遷移策略圖 (Migration Strategy - IF NEEDED)

```mermaid
graph TB
    Start[決定遷移至 Cloudinary] --> Phase1

    subgraph "Phase 1: 準備期 (1週)"
        Phase1[設定 Cloudinary 帳號]
        Phase1 --> Phase1a[取得 API Keys]
        Phase1a --> Phase1b[建立測試環境]
        Phase1b --> Phase1c[POC 測試]
    end

    Phase1c --> Phase2

    subgraph "Phase 2: 新上傳切換 (1週)"
        Phase2[修改上傳邏輯]
        Phase2 --> Phase2a[UploadZone 改用 Cloudinary]
        Phase2a --> Phase2b[ImageGeneration 改用 Cloudinary]
        Phase2b --> Phase2c[前端加入 URL 判斷]
    end

    Phase2c --> Phase3

    subgraph "Phase 3: 背景遷移 (2-4週)"
        Phase3[建立遷移 Job]
        Phase3 --> Phase3a[從 Supabase 下載舊圖]
        Phase3a --> Phase3b[批量上傳至 Cloudinary]
        Phase3b --> Phase3c[更新資料庫 URL]
        Phase3c --> Phase3d[驗證圖片可存取]
    end

    Phase3d --> Phase4

    subgraph "Phase 4: 驗證與清理 (1週)"
        Phase4[監控成本與效能]
        Phase4 --> Phase4a{是否符合預期?}
        Phase4a -->|YES| Phase4b[刪除 Supabase 舊檔]
        Phase4a -->|NO| Rollback[回滾至 Supabase]
        Phase4b --> Done[✅ 遷移完成]
    end

    Rollback --> Phase1c

    style Phase1c fill:#4CAF50,color:#fff
    style Phase4b fill:#4CAF50,color:#fff
    style Done fill:#4CAF50,color:#fff
    style Rollback fill:#F44336,color:#fff
```

---

## 9. 用量成長預測圖 (Usage Growth Projection)

```mermaid
graph LR
    subgraph "儲存用量 (GB)"
        A1[當前: 1GB]
        A2[6個月: 1.5GB]
        A3[12個月: 3GB]
        A4[24個月: 8GB]
    end

    subgraph "頻寬用量 (GB/月)"
        B1[當前: 10GB]
        B2[6個月: 22.5GB]
        B3[12個月: 60GB]
        B4[24個月: 240GB]
    end

    subgraph "Supabase 限制"
        C1[Free: 1GB + 2GB]
        C2[Pro: 100GB + 250GB]
    end

    A1 --> A2 --> A3 --> A4
    B1 --> B2 --> B3 --> B4

    A1 -.在限制內.- C1
    B1 -.超標.- C1
    A4 -.在限制內.- C2
    B4 -.在限制內.- C2

    style A1 fill:#4CAF50,color:#fff
    style A4 fill:#4CAF50,color:#fff
    style B1 fill:#FFC107,color:#000
    style B4 fill:#4CAF50,color:#fff
    style C1 fill:#2196F3,color:#fff
    style C2 fill:#2196F3,color:#fff
```

---

## 10. 監控架構圖 (Monitoring Architecture)

```mermaid
graph TB
    subgraph "數據源 (Data Sources)"
        A1[Supabase Storage<br/>用量 API]
        A2[Cloudflare CDN<br/>Analytics]
        A3[Sentry<br/>Performance]
        A4[PostgreSQL<br/>查詢統計]
    end

    subgraph "監控層 (Monitoring Layer)"
        B1[Storage Monitor<br/>自建儀表板]
        B2[Alerting System<br/>告警系統]
        B3[Performance Dashboard<br/>Sentry Dashboard]
    end

    subgraph "告警規則 (Alert Rules)"
        C1[儲存 > 90GB<br/>🔴 Critical]
        C2[頻寬 > 230GB<br/>🔴 Critical]
        C3[P95 > 3s<br/>🟡 Warning]
        C4[用戶投訴 > 5<br/>🟡 Warning]
    end

    subgraph "通知渠道 (Notification)"
        D1[Email]
        D2[Slack]
        D3[SMS]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B3
    A4 --> B1

    B1 --> B2
    B3 --> B2

    B2 --> C1
    B2 --> C2
    B2 --> C3
    B2 --> C4

    C1 --> D1
    C1 --> D2
    C1 --> D3
    C2 --> D1
    C2 --> D2
    C3 --> D1
    C4 --> D1

    style C1 fill:#F44336,color:#fff
    style C2 fill:#F44336,color:#fff
    style C3 fill:#FFC107,color:#000
    style C4 fill:#FFC107,color:#000
```

---

## 11. 架構演進路線圖 (Architecture Roadmap)

```mermaid
timeline
    title 圖片儲存架構演進路線圖
    section 2026 Q1 (當前)
        決策完成 : 選擇 Supabase Storage
                 : 產出完整架構文檔
    section 2026 Q2 (0-3個月)
        優化實施 : 圖片壓縮 (Sharp.js)
                 : CDN 快取優化
                 : 監控介面建置
    section 2026 Q3 (3-6個月)
        效果驗證 : 儲存減少 60%
                 : 頻寬減少 60%
                 : 成本維持 Free 方案
    section 2026 Q4 (6-9個月)
        重新評估 : 檢查用量是否接近限制
                 : 評估是否需要升級 Pro
    section 2027 Q1 (9-12個月)
        升級 Pro : 預計升級至 Supabase Pro
                : 持續監控與優化
    section 2027 Q2+ (12個月+)
        長期維護 : 若頻寬 > 230GB 則考慮遷移
                 : 否則持續使用 Supabase
```

---

## 12. 技術債務管理圖 (Technical Debt Management)

```mermaid
graph TB
    subgraph "技術債務評估"
        A1[當前架構<br/>Supabase Only]
        A2[技術債務: 低<br/>✅ 無額外維護]
        A3[遷移風險: 無<br/>✅ 可隨時遷移]
    end

    subgraph "若選擇 Cloudinary"
        B1[混合架構<br/>Supabase + Cloudinary]
        B2[技術債務: 高<br/>❌ 雙平台維護]
        B3[遷移風險: 高<br/>❌ 供應商鎖定]
    end

    subgraph "若選擇自建"
        C1[自建架構<br/>MinIO + CDN]
        C2[技術債務: 極高<br/>❌ 持續維護負擔]
        C3[遷移風險: 極高<br/>❌ 安全與備份]
    end

    A1 --> A2 --> A3
    B1 --> B2 --> B3
    C1 --> C2 --> C3

    A3 --> Decision{技術債務<br/>可接受?}
    B3 --> Decision
    C3 --> Decision

    Decision -->|可接受| Choose[✅ 選擇 Supabase]
    Decision -->|不可接受| Reject[❌ 拒絕方案]

    style A1 fill:#4CAF50,color:#fff
    style A2 fill:#4CAF50,color:#fff
    style A3 fill:#4CAF50,color:#fff
    style B2 fill:#F44336,color:#fff
    style C2 fill:#F44336,color:#fff
    style Choose fill:#4CAF50,color:#fff
```

---

## 如何使用這些圖表

### 在 Markdown 文件中渲染
這些 Mermaid 圖表可以在以下平台直接渲染：
- ✅ GitHub (原生支援)
- ✅ GitLab (原生支援)
- ✅ Notion (需安裝 Mermaid 插件)
- ✅ VS Code (需安裝 Mermaid 擴充套件)
- ✅ Obsidian (原生支援)

### 匯出為圖片
使用 Mermaid CLI:
```bash
# 安裝 Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# 匯出為 PNG
mmdc -i image-storage-architecture-diagrams.md -o architecture-diagram.png

# 匯出為 SVG
mmdc -i image-storage-architecture-diagrams.md -o architecture-diagram.svg
```

### 線上編輯器
- [Mermaid Live Editor](https://mermaid.live/)
- 複製圖表程式碼 → 貼上編輯器 → 匯出圖片

---

**維護者**: Leo (系統架構師)
**更新日期**: 2026-01-29
**版本**: 1.0
**相關文檔**: ADR-001, 實施指南, 決策矩陣
