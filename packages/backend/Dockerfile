# ---- Build ----
FROM oven/bun:1.4.2 AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/web/package.json ./packages/web/
RUN bun install --frozen-lockfile --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/backend ./packages/backend

ENV NODE_ENV=production

# Compile into a self-contained binary (no runtime needed in prod)
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    packages/backend/src/index.ts

# ---- Runtime (distroless — no shell, no package manager) ----
FROM gcr.io/distroless/base
WORKDIR /app
COPY --from=build /app/server server
ENV NODE_ENV=production
CMD ["./server"]
