FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for CV/OCR libraries (if any underlying libs need them)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    pandoc \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port (FastAPI default)
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
