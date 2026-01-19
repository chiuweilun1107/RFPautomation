# Database Migrations

## 安全設置指南

### ⚠️ 重要：不要提交敏感信息

此目錄包含數據庫遷移腳本。**千萬不要在 Python 文件中硬編碼密碼或 API keys**。

### 如何設置 apply_migration.py

1. **複製 example 文件：**
   ```bash
   cp apply_migration.py.example apply_migration.py
   ```

2. **設置環境變數：**
   ```bash
   export DB_HOST="aws-1-ap-northeast-1.pooler.supabase.com"
   export DB_PORT="6543"
   export DB_NAME="postgres"
   export DB_USER="postgres.goyonrowhfphooryfzif"
   export DB_PASS="your-actual-password-here"
   ```

3. **運行遷移：**
   ```bash
   python3 apply_migration.py
   ```

### 或使用 .env 文件

在項目根目錄的 `.env` 中設置變數，然後：

```bash
# 在 apply_migration.py 開始處添加
from dotenv import load_dotenv
load_dotenv()
```

### 📋 .gitignore 規則

```
backend/supabase/migrations/*.py
!backend/supabase/migrations/*.example.py
!backend/supabase/migrations/apply_migration.py.example
```

這確保：
- ✅ `apply_migration.py` 永遠不會被提交
- ✅ 只有 `.example.py` 文件被追蹤
- ✅ 防止密碼洩露

### 🔒 最佳實踐

1. **永遠使用環境變數**
   ```python
   DB_PASS = os.getenv('DB_PASS')
   ```

2. **檢查 .gitignore**
   確保你的 `.gitignore` 包含遷移 Python 文件規則

3. **使用 pre-commit hooks**
   項目已設置 pre-commit hook 自動檢測敏感信息

4. **Review before commit**
   在提交前檢查沒有 DB 密碼或 API keys

### 📝 SQL 遷移文件

SQL 遷移文件（`*.sql`）可以安全地被提交，因為它們不包含敏感數據。

例如：`20260119153000_expand_allowed_source_types.sql`
