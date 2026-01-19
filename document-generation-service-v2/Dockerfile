# 高保真文件生成服務 Dockerfile
# 基於 Node.js 18 (支援 easy-template-x)

FROM node:18-alpine

# 安裝 LibreOffice (用於 PDF 轉檔)
RUN apk add --no-cache \
    libreoffice \
    ttf-dejavu \
    fontconfig \
    font-noto-cjk

# 設定工作目錄
WORKDIR /app

# 複製 package.json
COPY package*.json ./

# 安裝依賴
RUN npm install --production

# 複製服務代碼
COPY service.js ./

# 建立輸出目錄
RUN mkdir -p /tmp/uploads /tmp/output

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8005

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 暴露端口
EXPOSE 8005

# 啟動服務
CMD ["node", "service.js"]

