FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

FROM base AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM deps AS builder

WORKDIR /app

COPY . .

RUN pnpm build

FROM base AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_PATH=/app/data/opendidatu.sqlite
ENV IMPORTED_OVERLAY_DIR=/app/data/imports
ENV MAP_DATA_DIR=/app/map
ENV MAP_AUTO_DOWNLOAD=true

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/bootstrap-runtime.mjs ./scripts/bootstrap-runtime.mjs

EXPOSE 3000

VOLUME ["/app/data", "/app/map"]

CMD ["node", "scripts/bootstrap-runtime.mjs"]