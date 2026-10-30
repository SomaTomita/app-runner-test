FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine

RUN apk add --no-cache tini && \
    addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Trust the public Amazon RDS CA bundle for verified PostgreSQL TLS.
RUN wget -q https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /usr/local/share/rds-ca.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/rds-ca.crt

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --chmod=755 scripts/start-production.sh ./scripts/start-production.sh

RUN chown -R appuser:nodejs /app
USER appuser

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./scripts/start-production.sh"]
