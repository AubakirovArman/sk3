FROM node:18-bullseye-slim AS base

WORKDIR /app

# Устанавливаем зависимости
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

# Этап сборки
FROM node:18-bullseye-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*
RUN npm ci
RUN npx prisma generate

COPY . .

ENV OPENAI_API_KEY=dummy_key_for_build
ENV NEXTAUTH_SECRET=dummy_secret_for_build
ENV NEXTAUTH_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

RUN npm run build

# Финальный этап
FROM node:18-bullseye-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Создаем директорию для загрузки видео с правильными правами
RUN mkdir -p ./public/videos && chown -R nextjs:nodejs ./public/videos

COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]