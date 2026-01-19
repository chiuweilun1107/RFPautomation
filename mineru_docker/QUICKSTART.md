# MinerU Docker 快速開始指南

## 🚀 30 秒快速啟動

```bash
cd mineru_docker
./start.sh
```

就這樣！服務將自動啟動並在 `http://localhost:8001` 運行。

## ✅ 驗證服務

### 1. 檢查健康狀態

```bash
curl http://localhost:8001/health
```

### 2. 查看完整 API 文檔

在瀏覽器中打開：http://localhost:8001/docs

## 📝 測試 PDF 解析

### 方法 1: 使用 Python 測試腳本

```bash
# 安裝依賴（如果還沒安裝）
pip install requests

# 運行測試
python test_service.py /path/to/your/document.pdf
```

### 方法 2: 使用 cURL

```bash
curl -X POST "http://localhost:8001/parse" \
  -F "file=@/path/to/your/document.pdf"
```

### 方法 3: 使用 Swagger UI

1. 打開 http://localhost:8001/docs
2. 找到 `/parse` 端點
3. 點擊 "Try it out"
4. 上傳 PDF 文件
5. 點擊 "Execute"

## 📁 查看輸出

解析後的 Markdown 文件會自動保存到 `./output/` 目錄：

```bash
ls -la output/
```

## 🛑 停止服務

```bash
docker-compose down
```

## 🔄 重啟服務

```bash
docker-compose restart
```

## 📊 查看日誌

```bash
# 即時日誌
docker-compose logs -f

# 最後 100 行
docker-compose logs --tail=100
```

## ⚙️ 常見調整

### 增加記憶體限制

編輯 `docker-compose.yml`：

```yaml
deploy:
  resources:
    limits:
      memory: 16G  # 從 8G 增加到 16G
```

### 增加 CPU 限制

```yaml
deploy:
  resources:
    limits:
      cpus: '6'  # 從 4 增加到 6 核心
```

## 🔧 疑難排解

### 問題: 無法連接到服務

```bash
# 檢查容器是否運行
docker-compose ps

# 檢查端口是否被佔用
lsof -i :8001

# 重啟服務
docker-compose restart
```

### 問題: 模型找不到

```bash
# 驗證模型路徑
ls -la ~/.cache/modelscope/hub/models/OpenDataLab/

# 應該看到:
# MinerU2___5-2509-1___2B/
# PDF-Extract-Kit-1___0/
```

### 問題: 記憶體不足

```bash
# 增加 Docker Desktop 的記憶體限制
# Docker Desktop > Settings > Resources > Memory > 增加到至少 8GB
```

## 📚 更多資訊

查看完整的 `README.md` 了解詳細文檔、API 參考和更多範例。

## 🎯 下一步

1. ✅ 啟動服務
2. ✅ 測試健康檢查
3. ✅ 解析一個 PDF 文件
4. 📖 閱讀完整文檔
5. 🔧 整合到您的應用程式

## 💡 提示

- 首次解析會比較慢（模型載入）
- 建議使用 SSD 以獲得更好的性能
- 大型 PDF 文件可能需要更多記憶體
- 輸出目錄 `output/` 會持久保存解析結果

## 🆘 需要幫助？

- 查看 `README.md` 的疑難排解部分
- 檢查容器日誌: `docker-compose logs -f`
- 參考 [MinerU 官方文檔](https://github.com/opendatalab/MinerU)
