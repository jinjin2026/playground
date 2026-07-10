# syntax=docker/dockerfile:1

FROM node:24-slim AS builder
WORKDIR /app

# better-sqlite3/sharp ship prebuilt binaries for most platforms, but keep a
# compile toolchain around as a fallback in case a prebuild isn't available.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are baked into the client bundle at build time.
ARG NEXT_PUBLIC_MCP_CALENDAR_URL=http://localhost:3000
ENV NEXT_PUBLIC_MCP_CALENDAR_URL=${NEXT_PUBLIC_MCP_CALENDAR_URL}

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
# (No VOLUME instruction here on purpose — only the web service actually uses
# /data, and docker-compose.yml already binds it there explicitly. Declaring
# VOLUME here would apply to the mcp service's image too and Docker would
# silently attach a fresh anonymous volume to it on every rebuild.)
ENV DATABASE_URL=/data/sqlite.db

# 3001 = Next.js web app, 3002 = MCP HTTP server (see docker-compose.yml —
# the two run as separate services/containers from this same image).
EXPOSE 3001 3002
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
