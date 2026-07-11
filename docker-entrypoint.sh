#!/bin/sh
set -e

DB_PATH="/app/data/fabbytrack.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found. Initializing with seed data..."
  npx tsx src/db/seed.ts
else
  echo "Database found at $DB_PATH. Skipping seed."
fi

echo "Starting server..."
exec node dist/server/entry.mjs
