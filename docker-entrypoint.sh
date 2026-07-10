#!/bin/sh
set -e

echo "Initializing database..."
npx tsx src/db/seed.ts

echo "Starting server..."
exec node dist/server/entry.mjs
