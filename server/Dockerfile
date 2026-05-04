FROM node:20-alpine AS builder

ARG CACHE_BUST=7
RUN echo "Cache bust: $CACHE_BUST"

WORKDIR /app

# Copy from server/ subdirectory (Railway builds from repo root context)
COPY server/package*.json ./
COPY server/nest-cli.json ./
COPY server/tsconfig*.json ./

RUN npm ci

COPY server/prisma ./prisma/
RUN npx prisma generate

COPY server/src ./src/
RUN npm run build

# ─── Production image ───────────────────────────────────────────────────────────
FROM node:20-alpine

# openssl3 matches linux-musl-openssl-3.0.x target
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma/

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/main"]