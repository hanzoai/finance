# finance.hanzo.ai — Hanzo Finance product web (landing + IAM login + app shell).
# Multi-stage build of the pnpm workspace: build the shared @hanzo/finance-ui, then the
# Next 15 standalone server. Build context is the REPO ROOT (declared in hanzo.yml), so
# the workspace + the linked package are both present. Built by CI/CD (arcd) for every
# arch — never locally. Base image uses the ECR Public Docker-library mirror to avoid
# Docker Hub's unauthenticated pull-rate limit on cold runners.
FROM public.ecr.aws/docker/library/node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ── build (install + gate + next build in one stage) ─────────────────────────
FROM base AS build
# Install deps first so the layer caches on the lockfile. `.npmrc` (node-linker=hoisted)
# MUST be present before install: the canonical stack dedupes the @hanzo/gui graph into a
# single hoisted tree, which is what lets the GuiCustomConfig type augmentation (see
# gui.d.ts → @hanzo/ui/gui-config) reach @hanzo/ui and the raw-TS @hanzo/data source.
# Under the isolated linker (no .npmrc) that augmentation is lost and the type gate fails
# on every vendor shorthand prop (bg/items/justify/rounded/…). Installing in this stage
# (not a separate deps stage) keeps the hoisted node_modules linker-agnostic — no
# per-package node_modules to cherry-pick across stages.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/finance-ui/package.json packages/finance-ui/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile
# Overlay source; `**/node_modules` is .dockerignored so the install above survives.
COPY . .
# The image build is the single CI gate (the bare runner has no Node). Type-check the
# shared package (its `build` IS `tsgo --noEmit` — TypeScript 7 native, one command, not
# a second spelling of the same check), run its unit tests, then build the Next app. A
# failing test or type error fails the image build, so nothing broken can deploy.
RUN pnpm --filter @hanzo/finance-ui build \
 && pnpm --filter @hanzo/finance-ui test \
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
