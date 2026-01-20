FROM node:18-alpine

# 安裝 OpenSSH 客戶端
RUN apk add --no-cache openssh-client

WORKDIR /app

# 複製依賴文件
COPY package*.json ./

# 安裝依賴
RUN npm install --production

# 複製應用代碼
COPY . .

# 創建臨時目錄
RUN mkdir -p /tmp/onlyoffice-parsing

# 暴露端口
EXPOSE 8005

# 啟動服務
CMD ["node", "server.js"]
