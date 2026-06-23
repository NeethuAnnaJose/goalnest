FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json ./web/
RUN npm ci --workspace=web --include-workspace-root

FROM deps AS builder
COPY web ./web
WORKDIR /app/web

ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_BILLING_ENABLED=false
ARG NEXT_PUBLIC_FREE_TRIAL_DAYS=30
ARG API_PROXY_TARGET=http://backend:3001

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BILLING_ENABLED=$NEXT_PUBLIC_BILLING_ENABLED
ENV NEXT_PUBLIC_FREE_TRIAL_DAYS=$NEXT_PUBLIC_FREE_TRIAL_DAYS
ENV API_PROXY_TARGET=$API_PROXY_TARGET
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/web/public ./web/public
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static

USER nextjs
WORKDIR /app/web
EXPOSE 3000

CMD ["node", "server.js"]
