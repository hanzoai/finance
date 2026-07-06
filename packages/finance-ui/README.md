# @hanzo/finance-ui

Shared finance data-layer + UI for every Hanzo Finance surface —
**finance.hanzo.ai** (the tenant shell), the **Hanzo Cloud console** per-org Finance
module, and the console **global-admin** finance view. One `FinanceClient`, one
component set, monochrome, USD **cents** end to end — so a spend / usage / credits card
looks and behaves identically at every scope. Scope (which org, or all-orgs) is a
property of the injected transport + identity, **never a different UI**.

Built on the canonical Hanzo component stack: **`@hanzo/ui`** (the product/dashboard
layer — `MetricCard`, `Panel`, `DataTable`, `Sparkline`, `LineChart`, `StatusTag`, …)
on **`@hanzo/gui`** (the Tamagui primitives). No hand-rolled CSS; every surface themes
off the shared Gui token system, so a finance card reads like any other console module.

## Install

```bash
npm i @hanzo/finance-ui @hanzo/ui @hanzo/gui
```

`react` / `react-dom` (≥18) and **`@hanzo/gui` (≥7.2.2)** / **`@hanzo/ui` (≥8)** are
peers — the HOST provides the `GuiProvider`. The package ships TS source (the canonical
Hanzo pattern), so add `@hanzo/finance-ui`, `@hanzo/ui`, `@hanzo/gui`, `@hanzo/data`
(and the transitive `@hanzogui/*`) to your bundler's `transpilePackages`.

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

## Styling & theming

Monochrome, on the shared `@hanzo/gui` token system — no CSS import, no hand-rolled
stylesheet. The HOST mounts one `GuiProvider` (the console + finance.hanzo.ai both do);
the board renders inside it. `<FinanceDashboard standalone>` (the default) wraps the
board in a `Theme` scope + page background for a standalone host; pass
`standalone={false}` inside an app that already mounts its own `GuiProvider`/`Theme`
(the console). `theme="light" | "dark"` pins the scope; otherwise it follows the host.
