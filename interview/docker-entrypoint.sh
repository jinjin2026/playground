#!/bin/sh
set -e

# The mcp service talks to the web service over HTTP and never touches the
# sqlite file directly, so it doesn't need (and shouldn't race on) migrations.
if [ "${SKIP_MIGRATIONS:-}" != "1" ]; then
  mkdir -p "$(dirname "$DATABASE_URL")"
  npm run db:migrate
fi

exec "$@"
