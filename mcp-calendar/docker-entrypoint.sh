#!/bin/sh
set -e

mkdir -p "$(dirname "$DATABASE_URL")"
npm run db:migrate

exec "$@"
