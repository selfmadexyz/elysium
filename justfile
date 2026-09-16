set shell := ["bash", "-cu"]

POSTGRES_PORT := "5434"
DATABASE_URL := "postgresql://postgres:localpassword@localhost:" + POSTGRES_PORT + "/myapp"

default:
    @just --list

# Install exactly what is recorded in bun.lock.
install:
    bun install --frozen-lockfile

# Start the unified TanStack Start server after preparing PostgreSQL.
dev:
    just postgres-start
    just migrate
    bun run dev

# Backwards-compatible alias used by the existing setup instructions.
start: dev

dev-web:
    bun run dev:web

dev-backend:
    bun run dev:backend

lint:
    bun run lint

test:
    bun run test

build:
    bun run build

check:
    bun run lint
    bun run test
    bun run build

postgres-start:
    POSTGRES_PORT="{{ POSTGRES_PORT }}" docker compose up --detach --wait postgres

postgres-stop:
    POSTGRES_PORT="{{ POSTGRES_PORT }}" docker compose stop postgres

stop: postgres-stop

postgres-remove:
    POSTGRES_PORT="{{ POSTGRES_PORT }}" docker compose down --volumes --remove-orphans

reset-db: postgres-remove

postgres-url:
    @echo "{{ DATABASE_URL }}"

migrate:
    DATABASE_URL="{{ DATABASE_URL }}" bun run db:migrate

generate-migration:
    DATABASE_URL="{{ DATABASE_URL }}" bun run db:generate

# Build the one-shot release image, then run it with the deployment environment.
migration-image tag="elysium-migrate:local":
    docker build --file packages/backend/Dockerfile --target migrate --tag {{ tag }} .

run-migration-image tag="elysium-migrate:local":
    docker run --rm --env-file packages/backend/.env {{ tag }}
