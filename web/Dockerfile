# finance.hanzo.ai — Hanzo Finance product web (landing + IAM login + app shell).
# Multi-stage build of the pnpm workspace: build the shared @hanzo/finance-ui, then the
# Next 15 standalone server. Build context is the REPO ROOT (declared in hanzo.yml), so
# the workspace + the linked package are both present. Built by CI/CD (arcd) for every
# arch — never locally. Base image uses the ECR Public Docker-library mirror to avoid
# Docker Hub's unauthenticated pull-rate limit on cold runners.
FROM public.ecr.aws/docker/library/node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ── deps (cached on lockfile) ────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/finance-ui/package.json packages/finance-ui/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/finance-ui/node_modules ./packages/finance-ui/node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY . .
RUN pnpm --filter @hanzo/finance-ui build \
 && pnpm --filter @hanzo/finance-web build

# ── runtime (Next standalone) ────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4200
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# Standalone traces from the workspace root, so the server + its node_modules land
# under /app and the app under /app/web.
COPY --from=build --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
USER nextjs
EXPOSE 4200
CMD ["node", "web/server.js"]
