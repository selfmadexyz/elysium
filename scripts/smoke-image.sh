#!/usr/bin/env bash
set -euo pipefail

: "${IMAGE:?Set the image to smoke}"
: "${IMAGE_KIND:?Set web or migrate}"

case "$IMAGE_KIND" in
    web|migrate) ;;
    *) echo "Unsupported image kind: $IMAGE_KIND" >&2; exit 1 ;;
esac

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

docker run --detach --name "$name" --network "$network" \
    --publish "127.0.0.1::3000" \
    --env PORT=3000 \
    --env DATABASE_URL="postgresql://postgres:postgres@${database}:5432/elysium_test" \
    --env BETTER_AUTH_SECRET=smoke-only-secret-at-least-32-characters \
    --env BETTER_AUTH_URL=http://localhost --env APP_URL=http://localhost \
    --env GOOGLE_CLIENT_ID=smoke-client --env GOOGLE_CLIENT_SECRET=smoke-secret \
    --env EMAIL_TRANSPORT=console "$IMAGE" >/dev/null
address=$(docker port "$name" 3000/tcp)
for attempt in {1..30}; do
    if curl --fail --silent --connect-timeout 1 --max-time 3 "http://${address}/api/health" | grep -q '"status":"healthy"'; then
        exit 0
    fi
    sleep 1
done
docker logs "$name" >&2
exit 1
