ARG BUN_VERSION=1.4.2

# ---- Dependencies ----
FROM oven/bun:${BUN_VERSION} AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/web/package.json ./packages/web/
RUN bun install --frozen-lockfile --ignore-scripts

# ---- Build ----
FROM dependencies AS build
WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/backend ./packages/backend
RUN bun install --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production

# Compile into a self-contained binary (no runtime needed in prod)
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    packages/backend/src/index.ts

# ---- One-shot database migration image ----
FROM dependencies AS migrate
WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/backend ./packages/backend
RUN bun install --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production
WORKDIR /app/packages/backend
CMD ["bun", "run", "db:migrate"]

# ---- Runtime (distroless — no shell, no package manager) ----
FROM gcr.io/distroless/base-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=build --chown=65532:65532 /app/server ./server
ENV NODE_ENV=production
EXPOSE 3001
USER 65532:65532
CMD ["./server"]
