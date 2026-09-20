# ---- Build ----
FROM oven/bun:latest AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/backend/package.json ./packages/backend/
RUN bun install --ignore-scripts

COPY . .

RUN bun run --cwd packages/web build

# ---- Run ----
FROM oven/bun:latest
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/web/.output ./.output
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
