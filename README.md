# finance

Hanzo's native financial core — the single source of truth for money on the
platform. One double-entry ledger, per-tenant on Hanzo Base, embedded in the
unified cloud binary. Replaces the Formance stack with native Go; Rust services
FFI in where they earn it.

## Why

The platform runs credits (commerce), a reserve fund (treasury), payouts
(referrals/affiliates/authors), and — soon — real cash + on-chain settlement.
That is one financial system, not five. `finance` is that system: an
append-only, always-balanced ledger that every money movement posts to, so the
books reconcile by construction and the reserve can never over-mint.

## Architecture — Formance, ported native

Formance (`github.com/formancehq/stack`) is a heavyweight microservices monorepo
(Postgres, message bus, service mesh). Hanzo runs ONE unified Go binary on Base.
So each Formance capability becomes a native Go module on Base, embedded in
`hanzoai/cloud` via the subsystem blank-import pattern:

| Formance component | Hanzo native repo | Store | Status |
|--------------------|-------------------|-------|--------|
| Ledger (double-entry, Numscript) | **hanzoai/ledger** | Base (HIP-0105 per-tenant SQLite) | core building (cloud/clients/treasury seed) |
| Payments (50+ processors) | **hanzoai/payments** | Base | connectors: Square + HUSD live via commerce; migrate under one API |
| Wallets | folds into ledger accounts | Base | native |
| Reconciliation | ledger module | Base | native |
| Orchestration (flows) | ledger module | Base | native (Numscript-compatible transaction DSL) |
| On-chain treasury / MPC-KMS | **hanzoai/treasury** + Hanzo L1 (36963) | EVM anchor | reserve fund + anchor building |

`finance` (this repo) is the entrypoint/umbrella that composes those modules and
exposes `/v1/finance/*`; cloud embeds it.

## Base storage (HIP-0105)

Per-tenant `data/{orgSlug}.db` (SQLite/ZapDB) with a per-org KMS-derived DEK,
WAL replicated to age-encrypted object storage. The ledger's accounts + journal
persist here — tenant-isolated by construction, encrypted at rest, no bespoke
store. Per-record validators/access-rules run in-process (goja/wazero/starkvm).

## Rust via FFI (the explorer-rs / blockscout precedent)

Performance- or crypto-critical pieces stay Rust and FFI into the Go binary via
cgo + a C ABI (cbindgen `extern "C"`, compiled `staticlib`) — exactly how the
ported blockscout services (lux/explorer-rs) link. Candidates:
- Numscript execution engine (hot path) — Rust, deterministic, FFI'd.
- On-chain signer / MPC (lux/treasury lineage) — Rust secure_storage signer.
- Reconciliation solver — if it needs the throughput.
Go owns orchestration + storage + API; Rust owns the compute kernels. One binary.

## On-chain (Hanzo L1, chain 36963 — live)

The ledger's fund/reserve state is hashed + anchored on the Hanzo L1 EVM via a
minimal TreasuryAnchor contract (KMS-signed, never plaintext) — EVM-auditable,
immutable. lux/treasury's Bridge provides the stablecoin/bank off-ramp for real
cash payouts drawing the same reserve.

## Migration — phased, one component at a time, always shippable

1. **Ledger core + reserve fund** (in flight): native double-entry on Base;
   referral/affiliate/author payouts DEBIT the fund (backed, reconciled).
2. **On-chain anchor**: fund state → Hanzo L1 (36963).
3. **Payments unification**: bring commerce's Square + HUSD under hanzoai/payments'
   one connector API; add cash rails (Bridge/Mercury/Column from lux/treasury).
4. **Numscript DSL** (Rust FFI): programmable transaction flows.
5. **Reconciliation + reporting**: close the books, statements, exports.

Each phase embeds into the unified cloud binary and surfaces in admin.hanzo.ai.
No parallel finance system, no Formance runtime — one native ledger.

## Where the code is today

This repo is the declared home; the implementation currently lives at
`hanzoai/cloud/apps/finance` (11 files, ~1378 lines) and is live — it serves
`finance.authorize`, `finance.record` and `finance.balance` on the internal
plane, and commerce injects its ledger adapter rather than owning a wallet.

It is not extracted yet because that would close a module cycle. `apps/finance`
imports `cloud/apps/money` (9×), `cloud/types` (8×), `cloud/internal/devmaster`
and `cloud/apps/treasury/ledger`; `cloud/apps/billing` and `cloud/apps/admin`
import it back. Lifting it out therefore requires hoisting `types`, `money` and
`treasury/ledger` into shared packages FIRST — the same cycle that kept o11y's
typed op table out of its own image until `Mount(app *zip.App)` broke the
dependency the other way.

The order is: hoist the shared types → move the package here → `cloud` imports
this repo and mounts it, exactly as it mounts o11y. Moving the files before the
hoist would produce a repo that cannot build, which is worse than the split
that exists now.

## Org layout

- **hanzo-fi/** — the Formance forks (`ledger`, `payments`, `auth`, `gateway`,
  `search`, `webhooks`, `stack`, `control`) plus `go-libs` and `numscript`.
  Third-party lineage stays in its own org. `go get` targets
  `github.com/hanzo-fi/numscript` (3 importers); the `hanzoai/numscript`
  duplicate had none and is archived.
- **hanzoai/finance** — this repo. Ours, original, OSS, top level: the umbrella
  that stitches those pieces into one product and presents them to cloud as a
  backend plugin.
