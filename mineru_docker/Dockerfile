FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MINERU_DEVICE_MODE=cpu \
    MAGIC_PDF_CONFIG_PATH=/app/mineru.json \
    HF_HUB_OFFLINE=1 \
    INSIDE_MODEL_SCOPE=1 \
    MINERU_VIRTUAL_VRAM_SIZE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libfontconfig1 \
    curl \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    "mineru[core]" \
    "ultralytics" \
    "paddlepaddle" \
    "fastapi" \
    "uvicorn[standard]" \
    "python-multipart" \
    "transformers" \
    "tokenizers" \
    "torch>=2.0.0" \
    "torchvision" \
    "python-docx" \
    "mammoth" \
    "docling"

# Create output directory with proper permissions
RUN mkdir -p /app/output && \
    chmod 755 /app/output

# Copy service script
COPY service.py /app/service.py

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health', timeout=5)" || exit 1

# Run the service
CMD ["python", "service.py"]
