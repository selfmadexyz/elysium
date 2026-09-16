ARG BUN_VERSION=1.4.2

# ---- Dependencies ----
FROM oven/bun:${BUN_VERSION} AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/backend/package.json ./packages/backend/
RUN bun install --frozen-lockfile --ignore-scripts

# ---- Build the TanStack Start/Nitro server ----
FROM dependencies AS build
COPY . .
RUN bun install --frozen-lockfile --ignore-scripts

ARG VITE_SITE_URL=http://localhost:3000
ENV NODE_ENV=production
ENV VITE_SITE_URL=${VITE_SITE_URL}

RUN bun run build:web

# ---- Runtime ----
FROM oven/bun:${BUN_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=bun:bun /app/packages/web/.output ./packages/web/.output

USER bun
EXPOSE 3000
CMD ["bun", "packages/web/.output/server/index.mjs"]
