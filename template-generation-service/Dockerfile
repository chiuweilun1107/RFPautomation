FROM node:18-alpine

WORKDIR /app

# 複製依賴文件
COPY package*.json ./

# 安裝依賴
RUN npm install --production

# 複製源代碼
COPY . .

# 創建臨時目錄
RUN mkdir -p /tmp/template-generation

EXPOSE 8007

CMD ["node", "server.js"]
