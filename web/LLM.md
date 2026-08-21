# finance web — LLM.md

The two **customer-facing** Hanzo Finance frontends and the DRY core they share.

## Map

```
packages/finance-ui/   @hanzo/finance-ui (PUBLISHED to npm) — the shared core.
web/                   finance.hanzo.ai — Next 15 landing + IAM login + app shell.
```

Both surfaces render the SAME `FinanceDashboard`, so a spend/usage/credits card is
identical in finance.hanzo.ai AND the Hanzo Cloud console Finance module
(`hanzoai/console` `src/components/products/FinanceModule.tsx`). That shared reuse is
the whole point — the two surfaces can never diverge.

## @hanzo/finance-ui — the one boundary

`FinanceClient` is the ONLY data seam. Two impls, swap = one line, ZERO UI change:
- `stubFinanceClient()` — deterministic in-memory data (landing preview / dev / tests).
- `httpFinanceClient(transport)` — real `/v1/finance/*`. The HOST injects `transport`
  (`(path, query) => Promise<unknown>`), so auth/proxy stays in the host:
  - console → its `/cloud` user-bearer proxy (`src/lib/api/finance-ledger.ts`).
  - finance.hanzo.ai → its BFF (`app/v1/finance/[...path]/route.ts`).

Optional-safe normalizers (a renamed/absent field → em-dash; card masked to brand+last4
by construction; USD **cents** end to end). A rejected read propagates → the host
renders its honest state; the client NEVER fabricates. Unit-tested (`src/*.test.ts`).

## The `/v1/finance/*` contract (what the backend must serve, per org)

Scoped server-side by the caller's bearer owner. `range ∈ {24h,7d,30d,90d}`.

| Method | Path | Payload |
|---|---|---|
| `balance` | `GET /v1/finance/balance` | `{ currency, availableCents, pendingCents, dueCents, asOf }` |
| `credits` | `GET /v1/finance/credits` | `Credit[]` `{ id, label, cents, grantedAt, expiresAt?, remainingCents? }` |
| `usage` | `GET /v1/finance/usage?range=` | `{ totalCents, currency, series[{date,cents}], lines[{label,units?,tokens?,cents}] }` |
| `invoices` | `GET /v1/finance/invoices` | `Invoice[]` `{ id, number?, date, cents, currency, status, url? }` |
| `payment-methods` | `GET /v1/finance/payment-methods` | `PaymentMethod[]` (masked: brand+last4 only) |
| `ledger` | `GET /v1/finance/ledger?range=` | `LedgerEntry[]` `{ id, date, account, description, cents, balanceCents? }` (double-entry) |
| `treasury` | `GET /v1/finance/treasury` | `{ reserveCents, committedCents, availableCents, anchor{chainId,address,block,anchoredAt} }` |

Normalizers accept common aliases + a casibase `{status,msg,data}` envelope, so the
exact wire shape can drift without breaking the UI. Money is cents; a dollar `amount`
is ×100'd.

## Auth (Hanzo IAM, NOT Casdoor)

App = **`hanzo-finance`** (public PKCE client, org `hanzo`), registered in IAM — see
`web/iam/`. Canonical routes `/v1/iam/oauth/*` (no `/api/` prefix). Flow:
`startSignin` (PKCE authorize) → `/auth/callback` → BFF `app/auth/signin` redeems the
code secretlessly (`pkceCodeGrant`; optional `IAM_CLIENT_SECRET` from KMS for a
confidential upgrade) → sealed httpOnly session (`src/lib/auth/session.ts`, AES-256-GCM,
chunked). `AuthGate` gates `/app`; `/auth/refresh` rotates.

## Modes

`FINANCE_MODE` = `live` (default; real `/v1/finance/*`) or `preview` (stub + honest
"Preview data" banner, for the landing screenshot and offline dev). The console module is
always live (honest states).

It is a SERVER variable and deliberately not `NEXT_PUBLIC_*`. Next inlines a
`NEXT_PUBLIC_*` read into the client bundle when the image is BUILT, so the browser gets
whatever the builder's environment said and a Deployment setting it at runtime is
ignored — that shipped fabricated stub money to signed-in users on finance.hanzo.ai.
`/app` is `force-dynamic`, `financeMode()` reads the env on the running server, and the
value reaches the browser as a prop. One image, every environment. Live is the default so
a missing variable yields an honest error, never invented numbers.

## Build / deploy

pnpm workspace. `pnpm --filter @hanzo/finance-ui build` then `pnpm --filter
@hanzo/finance-web build` (Next standalone). Image = `web/Dockerfile` (context = repo
root), declared in root `hanzo.yml`, built by `hanzoai/ci` on arc — **never locally**.
`@hanzo/finance-ui` is published to npm (both surfaces consume the same version).
