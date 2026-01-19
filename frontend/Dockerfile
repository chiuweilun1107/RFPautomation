# 多階段建置 - 建置階段
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製所有檔案
COPY . .

# 設定建置時環境變數
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# 建置 Next.js 應用
RUN npm run build

# 生產階段
FROM node:20-alpine AS runner

WORKDIR /app

# 設定環境變數
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 接收運行時環境變數（可以在 docker run 時通過 -e 或 --env-file 傳入）
ARG N8N_WEBHOOK_URL
ARG N8N_INGEST_WEBHOOK
ARG N8N_TEMPLATE_PARSE_WEBHOOK
ARG N8N_DOCUMENT_GENERATE_WEBHOOK
ARG N8N_WEBHOOK_TEXT_REMOVAL
ARG N8N_IMAGE_GENERATION_WEBHOOK
ARG N8N_INTEGRATE_CHAPTER_WEBHOOK
ARG N8N_BASE_URL

# 設定環境變數，如果沒有傳入則使用預設值
ENV N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL:-http://localhost:5679/webhook/parse-tender}
ENV N8N_INGEST_WEBHOOK=${N8N_INGEST_WEBHOOK:-http://localhost:5679/webhook/ingest}
ENV N8N_TEMPLATE_PARSE_WEBHOOK=${N8N_TEMPLATE_PARSE_WEBHOOK:-http://localhost:5679/webhook/parse-template-v2}
ENV N8N_DOCUMENT_GENERATE_WEBHOOK=${N8N_DOCUMENT_GENERATE_WEBHOOK:-http://localhost:5679/webhook/generate-document-v2}
ENV N8N_WEBHOOK_TEXT_REMOVAL=${N8N_WEBHOOK_TEXT_REMOVAL:-http://localhost:5679/webhook/remove-text}
ENV N8N_IMAGE_GENERATION_WEBHOOK=${N8N_IMAGE_GENERATION_WEBHOOK:-http://localhost:5679/webhook/generate-image}
ENV N8N_INTEGRATE_CHAPTER_WEBHOOK=${N8N_INTEGRATE_CHAPTER_WEBHOOK:-http://localhost:5679/webhook/integrate-chapter}
ENV N8N_BASE_URL=${N8N_BASE_URL:-http://localhost:5679}

# 建立非 root 使用者
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製必要檔案
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 設定權限
RUN chown -R nextjs:nodejs /app

USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動應用
CMD ["node", "server.js"]
