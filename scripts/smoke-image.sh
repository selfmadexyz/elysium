#!/usr/bin/env bash
set -euo pipefail

: "${IMAGE:?Set the image to smoke}"
: "${IMAGE_KIND:?Set web, backend or migrate}"

name="elysium-smoke-${IMAGE_KIND}-${RANDOM}"
network="${name}-net"
database="${name}-db"
cleanup() {
    docker rm --force --volumes "$name" "$database" >/dev/null 2>&1 || true
    docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create "$network" >/dev/null
docker run --detach --name "$database" --network "$network" \
    --env POSTGRES_USER=postgres --env POSTGRES_PASSWORD=postgres --env POSTGRES_DB=elysium_test \
    postgres:17-alpine >/dev/null
ready=0
for attempt in {1..30}; do
    if docker exec "$database" pg_isready -h 127.0.0.1 -U postgres -d elysium_test >/dev/null 2>&1; then
        ready=1
        break
    fi
    sleep 1
done
if [[ "$ready" != "1" ]]; then
    echo "Smoke PostgreSQL did not become ready over TCP" >&2
    docker logs "$database" >&2 || true
    exit 1
fi

if [[ "$IMAGE_KIND" == "migrate" ]]; then
    docker run --rm --name "$name" --network "$network" \
        --env DATABASE_URL="postgresql://postgres:postgres@${database}:5432/elysium_test" "$IMAGE"
    docker exec "$database" psql -U postgres -d elysium_test -Atc "SELECT to_regclass('public.posts') IS NOT NULL" | grep -qx t
    exit 0
fi

: "${IMAGE_PORT:?Set the image listening port}"
docker run --detach --name "$name" --network "$network" \
    --publish "127.0.0.1::${IMAGE_PORT}" \
    --env PORT="$IMAGE_PORT" \
    --env DATABASE_URL="postgresql://postgres:postgres@${database}:5432/elysium_test" \
    --env BETTER_AUTH_SECRET=smoke-only-secret-at-least-32-characters \
    --env BETTER_AUTH_URL=http://localhost --env APP_URL=http://localhost \
    --env GOOGLE_CLIENT_ID=smoke-client --env GOOGLE_CLIENT_SECRET=smoke-secret "$IMAGE" >/dev/null
address=$(docker port "$name" "${IMAGE_PORT}/tcp")
for attempt in {1..30}; do
    if curl --fail --silent --connect-timeout 1 --max-time 3 "http://${address}/api/health" | grep -q '"status":"healthy"'; then
        exit 0
    fi
    sleep 1
done
docker logs "$name" >&2
exit 1
