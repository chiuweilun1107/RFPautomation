# 基於 Python 3.11 (ARM64 相容)
FROM python:3.11-slim

WORKDIR /app

# 安裝 LibreOffice + 中文字體 + curl (健康檢查用)
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製服務代碼
COPY service.py .

# 建立必要的目錄
RUN mkdir -p templates output

# 暴露端口
EXPOSE 8003

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# 啟動服務
CMD ["python", "service.py"]

