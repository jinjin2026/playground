# syntax=docker/dockerfile:1

FROM node:24-slim AS builder
WORKDIR /app

# better-sqlite3 ships prebuilt binaries for most platforms, but keep a
# compile toolchain around as a fallback in case a prebuild isn't available.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `next build` imports every API route to analyze it, which runs the
# top-level `new Database(...)` in src/db/index.ts. With no sqlite.db yet,
# next build's parallel workers race to create/initialize it at once and
# throw SQLITE_BUSY. Migrating first creates a ready WAL-mode file so those
# imports just open an already-initialized db instead of racing to create one.
RUN npm run db:migrate && npm run build

# ---

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# better-sqlite3's native binding was compiled in the builder stage against
# this same base image, so the whole node_modules tree can be copied as-is.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Keep the sqlite file on a dedicated, mountable path instead of the app root.
ENV DATABASE_URL=/data/sqlite.db

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
