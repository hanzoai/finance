# @hanzo/finance-ui

Shared finance data-layer + UI for the two Hanzo Finance surfaces —
**finance.hanzo.ai** (the product shell) and the **Hanzo Cloud console** Finance
module. One `FinanceClient`, one component set, monochrome, USD **cents** end to end,
so a spend / usage / credits card looks and behaves identically in both.

## Install

```bash
npm i @hanzo/finance-ui
```

`react` / `react-dom` are peers (≥18).

## Use

```tsx
import { FinanceDashboard, stubFinanceClient, httpFinanceClient } from '@hanzo/finance-ui'

// Preview / landing / local dev — deterministic in-memory data, no backend.
<FinanceDashboard client={stubFinanceClient()} mode="preview" />

// Live — the host injects the transport (its own bearer-scoped fetch to /v1/finance/*).
const client = httpFinanceClient((path, query) => myBearerGet(`finance/${path}`, query))
<FinanceDashboard client={client} />
```

Swapping `stubFinanceClient()` ⇄ `httpFinanceClient(transport)` is a one-line change
with **zero UI change** — the components never know which one they got.

## The `/v1/finance/*` contract

`httpFinanceClient` reads, per org (scoped server-side by the caller's bearer):

| Method | Path | Shape |
|---|---|---|
| `balance()` | `GET /v1/finance/balance` | `{ availableCents, pendingCents, dueCents, currency, asOf }` |
| `credits()` | `GET /v1/finance/credits` | `Credit[]` |
| `usage(range)` | `GET /v1/finance/usage?range=` | `{ totalCents, series[], lines[] }` |
| `invoices()` | `GET /v1/finance/invoices` | `Invoice[]` |
| `paymentMethods()` | `GET /v1/finance/payment-methods` | `PaymentMethod[]` (masked) |
| `ledger(range)` | `GET /v1/finance/ledger?range=` | `LedgerEntry[]` (double-entry) |
| `treasury()` | `GET /v1/finance/treasury` | `TreasurySummary` |

Every payload is run through an optional-safe normalizer: a renamed/absent field
degrades to `—`, an unconfigured backend yields honest zeros/empty, and a card is
masked to brand + last4 (a PAN can never reach the UI). A rejected read propagates so
the host renders its own honest state — the client never fabricates.

## Styling

Self-contained monochrome CSS, injected once by `<FinanceRoot>` (which
`FinanceDashboard` renders by default). No CSS import, no bundler config. Theme-aware:
light by default, dark via `prefers-color-scheme` or an explicit `theme="dark"`.
