ARG BUN_VERSION=1.4.4

FROM oven/bun:${BUN_VERSION} AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/backend/package.json ./packages/backend/
COPY packages/contracts/package.json ./packages/contracts/
RUN bun install --frozen-lockfile --ignore-scripts

FROM dependencies AS migrate
COPY tsconfig.json ./
COPY packages/backend ./packages/backend
COPY packages/contracts ./packages/contracts
ENV NODE_ENV=production
WORKDIR /app/packages/backend
CMD ["bun", "run", "db:migrate"]

FROM dependencies AS build
COPY . .

ARG VITE_SITE_URL=http://localhost:3000
ENV NODE_ENV=production
ENV VITE_SITE_URL=${VITE_SITE_URL}

RUN bun run build:web

FROM oven/bun:${BUN_VERSION} AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=bun:bun /app/packages/web/.output ./packages/web/.output

USER bun
EXPOSE 3000
CMD ["bun", "packages/web/.output/server/index.mjs"]
