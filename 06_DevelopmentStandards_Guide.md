# 06_開發規範指南 (Development Standards Guide)

---

## 1. 目的與 AI 指令 (Purpose & AI Instructions)

**致 AI 模型：**

本文件是您在進行 **context coding** 時必須參考的 **開發規範完整指南**。無論是生成新程式碼、重構現有程式碼，還是進行程式碼審查，都必須嚴格遵循本文件中的規範。

本文件旨在為所有 AI 開發代理（前端、後端、QA）提供一套統一的、必須遵循的開發標準與實踐指南。系統架構師 (SA-Leo) 將根據專案需求，從下方選擇合適的標準組合，並將其整合進專案的 `docs/` 目錄中，作為該專案的「真理之源」。

---

## 2. 免費視覺資源庫 (Free Visual Resource Libraries)

在進行 UI 設計稿製作或前端開發時，若需要使用示意圖或素材，應優先從以下經過授權的免費資源庫中獲取。這能確保所有視覺材料都可用於商業專案，並避免潛在的版權問題。

*   **Unsplash** ([https://unsplash.com/](https://unsplash.com/))
    *   **說明**: 提供大量高品質、高解析度的攝影照片，風格偏向藝術與生活感。所有照片均可免費使用於個人及商業專案，無需署名。
*   **Pexels** ([https://www.pexels.com/](https://www.pexels.com/))
    *   **說明**: 同樣提供高品質的免費照片及影片。其搜尋功能強大，內容涵蓋範圍廣泛。所有內容均遵循 Pexels License，可免費商用。
*   **Pixabay** ([https://pixabay.com/](https://pixabay.com/))
    *   **說明**: 一個龐大的社群，不僅提供照片，還包含向量圖形、插圖及影片。所有內容均在 Pixabay License 下發布，可安全地用於商業用途，無需署名。

---

## 2. 規範套件分類 (Standard Packages)

### **基本規範套件 (Basic Package)**
適用於：小型專案、原型開發、學習專案

#### **前端規範**
- **程式碼風格**：ESLint + Prettier
- **基本資安**：HTTPS、輸入驗證
- **效能監控**：基本載入時間監控

#### **後端規範**
- **API設計**：RESTful原則
- **錯誤處理**：統一回應格式
- **基本資安**：輸入驗證、SQL注入防護

#### **資料庫規範**
- **命名規範**：snake_case
- **基本索引**：主鍵、外鍵索引
- **資料驗證**：NOT NULL約束

### **完整規範套件 (Complete Package)**
適用於：中型專案、商業應用、團隊開發

#### **前端規範**
- **程式碼品質**：TypeScript、單元測試
- **效能優化**：程式碼分割、圖片優化
- **無障礙設計**：WCAG 2.1 AA標準
- **國際化**：i18n支援

#### **後端規範**
- **身份驗證**：JWT Token
- **授權控制**：RBAC角色管理
- **日誌記錄**：結構化日誌
- **快取策略**：Redis/Memory Cache

#### **資料庫規範**
- **正規化設計**：避免資料冗餘
- **效能優化**：查詢優化、索引策略
- **版本控制**：Migration檔案

#### **測試規範**
- **測試金字塔**：70%單元測試、20%整合測試、10%E2E測試
- **覆蓋率要求**：80%以上程式碼覆蓋率

### **企業級規範套件 (Enterprise Package)**
適用於：大型專案、企業應用、高安全要求

#### **前端規範**
- **微前端架構**：模組化開發
- **效能監控**：Real User Monitoring
- **安全標頭**：CSP、HSTS等
- **無障礙設計**：WCAG 2.1 AAA標準

#### **後端規範**
- **微服務架構**：服務拆分、API Gateway
- **高級資安**：多因子認證、資安審計
- **效能監控**：APM工具整合
- **容器化**：Docker + Kubernetes

#### **資料庫規範**
- **分散式資料庫**：讀寫分離、分片
- **備份策略**：自動備份、災難復原
- **效能監控**：慢查詢分析

#### **資安規範**
- **合規要求**：SOC2、GDPR、ISO 27001
- **滲透測試**：定期安全掃描
- **零信任架構**：最小權限原則

---

## 3. 具體規範內容 (Detailed Standards)

### **3.1 前端開發規範**

#### **程式碼風格**
```typescript
// 元件命名：PascalCase
export class UserProfileComponent {
  // 屬性命名：camelCase
  private userName: string;
  
  // 方法命名：camelCase
  public getUserData(): void {
    // 實作
  }
}

// 檔案命名：kebab-case
// user-profile.component.ts
// user-profile.component.html
// user-profile.component.scss
// user-profile.component.spec.ts
```

#### **效能優化**
```typescript
// 程式碼分割
const LazyModule = lazy(() => import('./lazy.module'));

// 圖片優化
<img src="image.webp" alt="描述" loading="lazy" />

// 快取策略
const cache = new Map();
function getCachedData(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  // 獲取資料並快取
}
```

### **3.2 後端開發規範**

#### **API設計**
```csharp
// 統一回應格式
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T Data { get; set; }
    public string Message { get; set; }
    public int StatusCode { get; set; }
}

// RESTful API設計
[ApiController]
[Route("api/v1/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<List<UserDto>>> GetUsers()
    {
        // 實作
    }
}
```

#### **錯誤處理**
```csharp
// 全域錯誤處理
public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // 統一錯誤處理邏輯
        return true;
    }
}
```

### **3.3 資料庫設計規範**

#### **命名規範**
```sql
-- 表格命名：複數名詞，snake_case
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引命名
CREATE INDEX idx_users_email ON users(email_address);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 外鍵命名
ALTER TABLE orders ADD CONSTRAINT fk_orders_users 
FOREIGN KEY (user_id) REFERENCES users(id);
```

#### **效能優化**
```sql
-- 查詢優化
EXPLAIN ANALYZE SELECT u.user_name, o.order_date
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
ORDER BY o.order_date DESC
LIMIT 10;
```

### **3.4 資安規範**

#### **身份驗證**
```csharp
// JWT Token驗證
[Authorize]
[ApiController]
public class SecureController : ControllerBase
{
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        // 實作
    }
}
```

#### **輸入驗證**
```csharp
// FluentValidation
public class CreateUserValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);
            
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]");
    }
}
```

### **3.5 效能規範**

#### **前端效能指標**
```typescript
// Core Web Vitals監控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### **後端效能監控**
```csharp
// 效能監控
[HttpGet]
public async Task<IActionResult> GetData()
{
    using var activity = _activitySource.StartActivity("GetData");
    activity?.SetTag("operation", "get_data");
    
    // 實作
    return Ok(result);
}
```

---

## 4. 工具與最佳實踐 (Tools & Best Practices)

### **4.1 前端工具**
```bash
# 程式碼品質
npm install --save-dev eslint prettier @typescript-eslint/parser
npm install --save-dev husky lint-staged

# 效能監控
npm install --save-dev lighthouse webpack-bundle-analyzer
npm install web-vitals

# 測試工具
npm install --save-dev jest @testing-library/react
npm install --save-dev cypress
```

### **4.2 後端工具**
```bash
# .NET Core
dotnet add package FluentValidation
dotnet add package Serilog
dotnet add package AutoMapper
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# Node.js
npm install joi winston helmet express-rate-limit
npm install prom-client
```

### **4.3 資料庫工具**
```sql
-- PostgreSQL效能監控
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE schemaname = 'public';

-- 慢查詢分析
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 5. 監控與執行機制 (Monitoring & Enforcement)

### **5.1 自動化檢查**
- **程式碼品質**：ESLint、SonarQube
- **安全掃描**：OWASP ZAP、Snyk
- **效能監控**：Lighthouse CI、WebPageTest

### **5.2 持續整合**
```yaml
# GitHub Actions範例
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: npm test
      - name: Security Scan
        run: npm audit
      - name: Performance Check
        run: npm run lighthouse
```

### **5.3 定期審查**
- **程式碼審查**：Pull Request流程
- **安全審計**：每月安全掃描
- **效能審查**：每週效能報告

---

## 6. 規範選擇指南 (Standard Selection Guide)

### **選擇基本規範套件的情況：**
- 小型專案或原型開發
- 學習或實驗性質
- 時間和資源有限

### **選擇完整規範套件的情況：**
- 中型商業應用
- 團隊協作開發
- 需要長期維護

### **選擇企業級規範套件的情況：**
- 大型企業應用
- 高安全要求
- 需要合規認證

---

## 7. 規範實施檢查清單 (Implementation Checklist)

### **前端檢查項目**
- [ ] ESLint和Prettier配置
- [ ] TypeScript型別檢查
- [ ] 單元測試覆蓋率
- [ ] 效能監控設置
- [ ] 無障礙設計檢查

### **後端檢查項目**
- [ ] API設計規範
- [ ] 錯誤處理機制
- [ ] 身份驗證設置
- [ ] 日誌記錄配置
- [ ] 安全標頭設置

### **資料庫檢查項目**
- [ ] 命名規範遵循
- [ ] 索引策略實施
- [ ] 資料驗證約束
- [ ] 備份策略設置
- [ ] 效能監控配置

### **資安檢查項目**
- [ ] HTTPS強制使用
- [ ] 輸入驗證實施
- [ ] SQL注入防護
- [ ] XSS防護措施
- [ ] CSRF防護設置

---

## 8. 結語

本規範指南是AI進行context coding時的重要參考文件。AI必須根據專案的具體需求和選擇的規範套件，嚴格遵循相應的開發標準，確保程式碼品質、安全性和可維護性。

在實際開發中，AI應該：
1. **主動檢查**：確保生成的程式碼符合選定的規範
2. **持續改進**：根據專案發展調整規範實施
3. **品質保證**：透過自動化工具確保規範執行
4. **文件更新**：及時更新相關的規範文件 
