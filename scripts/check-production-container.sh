#!/usr/bin/env bash
set -euo pipefail

# Use disposable local containers and synthetic configuration only. No AWS calls.
IMAGE="${1:-learning-backend:ci}"
CHECK_PREFIX="learning-check-$$"
CHECK_NETWORK="${CHECK_PREFIX}-network"
CHECK_DB="${CHECK_PREFIX}-db"
CHECK_API="${CHECK_PREFIX}-api"

cleanup() {
  docker rm --force "$CHECK_API" "$CHECK_DB" >/dev/null 2>&1 || true
  docker network rm "$CHECK_NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT

wait_for_health() {
  local attempt
  for attempt in {1..60}; do
    if [[ "$(docker inspect --format '{{.State.Running}}' "$CHECK_API")" != true ]]; then
      docker logs "$CHECK_API"
      return 1
    fi
    if docker exec "$CHECK_API" node -e '
      require("http").get("http://127.0.0.1:3000/api/health", (res) => {
        res.resume(); process.exitCode = res.statusCode === 200 ? 0 : 1;
      }).on("error", () => { process.exitCode = 1; });
    ' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  docker logs "$CHECK_API"
  return 1
}

docker network create --internal "$CHECK_NETWORK" >/dev/null
docker run --detach --name "$CHECK_DB" --network "$CHECK_NETWORK" \
  --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_USER=learning -e POSTGRES_PASSWORD=local-test-only \
  -e POSTGRES_DB=learning postgres:16-alpine >/dev/null

for attempt in {1..60}; do
  if docker exec "$CHECK_DB" pg_isready -h 127.0.0.1 -U learning -d learning >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$CHECK_DB" pg_isready -h 127.0.0.1 -U learning -d learning >/dev/null

docker run --detach --name "$CHECK_API" --network "$CHECK_NETWORK" \
  -e "DATABASE_URL=postgresql://learning:local-test-only@${CHECK_DB}:5432/learning" \
  -e NODE_ENV=production -e STORAGE_TYPE=local \
  -e CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS50ZXN0JA \
  -e CLERK_SECRET_KEY=sk_test_local_only_not_a_real_key \
  -e ALLOWED_USER_IDS=user_local_test "$IMAGE" >/dev/null

wait_for_health

# Exercise the real generated client and database, without mocking Prisma.
docker exec "$CHECK_API" node -e '
  const { prisma } = require("./dist/lib/prisma.js");
  (async () => {
    const user = await prisma.user.create({ data: { email: "local-check@example.com", name: "Initial" } });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { name: "Updated" } });
    if (updated.name !== "Updated") throw new Error("Update failed");
    await prisma.user.delete({ where: { id: user.id } });
    if (await prisma.user.count() !== 0) throw new Error("Cleanup failed");
    console.log("Production image: migration, PostgreSQL CRUD, and health check passed.");
  })().catch((err) => { console.error(err.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
'

docker exec "$CHECK_API" node -e '
  require("http").get("http://127.0.0.1:3000/api/users", (res) => {
    res.resume(); process.exitCode = res.statusCode === 401 ? 0 : 1;
  }).on("error", () => { process.exitCode = 1; });
'

# The AWS URL requires verified TLS. A plaintext-only test server must be rejected.
CHECK_TLS_URL="postgresql://learning:local-test-only@${CHECK_DB}:5432/learning?sslmode=verify-full&sslaccept=strict&sslrootcert=/usr/local/share/rds-ca.crt"
if CHECK_TLS_OUTPUT=$(docker exec -e "DATABASE_URL=$CHECK_TLS_URL" "$CHECK_API" \
  ./node_modules/.bin/prisma migrate deploy 2>&1); then
  echo "Migration CLI unexpectedly accepted a server without TLS."
  exit 1
fi
case "$CHECK_TLS_OUTPUT" in
  *TLS*|*SSL*) echo "Migration CLI rejected plaintext PostgreSQL with the AWS TLS settings." ;;
  *) printf '%s\n' "$CHECK_TLS_OUTPUT"; exit 1 ;;
esac

docker restart "$CHECK_API" >/dev/null
wait_for_health
echo "Production image: unauthenticated API rejection and repeat startup passed."
