set shell := ["bash", "-cu"]

POSTGRES_CONTAINER := "elysium-postgres"
POSTGRES_VOLUME := "elysium-postgres-data"
POSTGRES_IMAGE := "postgres:17-alpine"
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
    #!/usr/bin/env bash
    set -euo pipefail
    if docker ps --quiet --filter "name=^/{{ POSTGRES_CONTAINER }}$" | grep -q .; then
        echo "PostgreSQL is already running"
    elif docker ps --all --quiet --filter "name=^/{{ POSTGRES_CONTAINER }}$" | grep -q .; then
        docker start {{ POSTGRES_CONTAINER }} >/dev/null
        echo "PostgreSQL started"
    else
        docker volume create {{ POSTGRES_VOLUME }} >/dev/null
        docker run --name {{ POSTGRES_CONTAINER }} \
            --env POSTGRES_USER=postgres \
            --env POSTGRES_PASSWORD=localpassword \
            --env POSTGRES_DB=myapp \
            --detach \
            --publish 127.0.0.1:{{ POSTGRES_PORT }}:5432 \
            --volume {{ POSTGRES_VOLUME }}:/var/lib/postgresql/data \
            {{ POSTGRES_IMAGE }} >/dev/null
        echo "PostgreSQL created and started"
    fi

    for attempt in {1..30}; do
        if docker exec {{ POSTGRES_CONTAINER }} pg_isready --username postgres --dbname myapp >/dev/null 2>&1; then
            exit 0
        fi
        sleep 1
    done

    echo "PostgreSQL did not become ready in time" >&2
    exit 1

postgres-stop:
    docker stop {{ POSTGRES_CONTAINER }} 2>/dev/null || true

stop: postgres-stop

postgres-remove:
    docker rm --force {{ POSTGRES_CONTAINER }} 2>/dev/null || true

reset-db: postgres-remove
    docker volume rm {{ POSTGRES_VOLUME }} 2>/dev/null || true

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
