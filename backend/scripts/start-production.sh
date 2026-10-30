#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${CLERK_PUBLISHABLE_KEY:?CLERK_PUBLISHABLE_KEY is required}"
: "${CLERK_SECRET_KEY:?CLERK_SECRET_KEY is required}"
: "${ALLOWED_USER_IDS:?ALLOWED_USER_IDS is required}"

# Apply committed migrations before accepting requests. Never reset or seed data.
./node_modules/.bin/prisma migrate deploy
exec node dist/server.js
