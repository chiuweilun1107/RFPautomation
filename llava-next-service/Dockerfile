FROM python:3.11-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴和 Tesseract OCR
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    tesseract-ocr \
    tesseract-ocr-chi-tra \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式
COPY service.py .

# 創建輸出目錄
RUN mkdir -p /app/tmp /app/output

# 暴露端口
EXPOSE 8000

# 設置環境變量
ENV PYTHONUNBUFFERED=1

# 啟動服務
CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8000"]
