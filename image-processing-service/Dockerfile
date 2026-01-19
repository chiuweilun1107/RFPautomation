FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
# libglib2.0-0 is required for opencv even in headless mode sometimes, and other libs for pillow/rembg
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create a directory for u2net models to persist them if volume mounted
# Default rembg home is ~/.u2net
ENV U2NET_HOME=/app/models/.u2net

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
