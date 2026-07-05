# Registering `hanzo-finance` in Hanzo IAM

> **Status: REGISTERED + VERIFIED LIVE (2026-07-05).** The app `hanzo/hanzo-finance`
> exists in Hanzo IAM (hanzo.id): `GET /v1/iam/get-app-login?clientId=hanzo-finance`
> resolves (no "Invalid client_id"), the authorize endpoint 302s to the hosted login,
> and the redirect URIs / grant types below are stored. This file is the source of truth
> for re-provisioning (disaster recovery, a new brand host, or a fresh IAM). It is a
> PUBLIC PKCE client (IAM admits the empty-secret + S256-verifier exchange).


finance.hanzo.ai signs in with **Hanzo IAM** (NOT Casdoor) as the OAuth app
`hanzo-finance` — the `<org>-<app>` naming scheme, org `hanzo`. It is a **public**
client using **PKCE** (RFC 7636, no client secret): the browser authorizes with an
S256 challenge and the BFF (`app/auth/signin`) redeems the code with the verifier.

Without this app row, IAM's `get-app-login` / authorize returns **"Invalid client_id"**
(`object/token_oauth.go`, emitted when `GetApplicationByClientId` finds no row). The
`hanzo-finance` name passes IAM's `validateAppName` (`^hanzo-…$`) and is NOT
capability-reserved.

## Register (the standard path for a Hanzo web app)

`iam app upsert` (the same mechanism `hanzo-console` / `hanzo-chat` use — provisioned
out-of-band via the admin API, not the brand-app `init-apps` seed). From a host with
the `iam` CLI and an admin token:

```bash
iam --addr https://iam.hanzo.ai --token "$IAM_TOKEN" app upsert web/iam/hanzo-finance.json
# verify
iam --addr https://iam.hanzo.ai --token "$IAM_TOKEN" app get hanzo-finance
# add another redirect later (idempotent)
iam --addr https://iam.hanzo.ai --token "$IAM_TOKEN" app redirect add hanzo-finance https://finance.hanzo.ai/auth/callback
```

Equivalently, the raw API: `POST https://iam.hanzo.ai/v1/iam/add-application` with this
JSON body (admin-org client credentials `IAM_CLIENT_ID`/`IAM_CLIENT_SECRET`).

## Durable / self-healing (recommended)

`iam app upsert` rows do NOT self-heal on redeploy (only the hard-coded per-brand
`brandSpecs` in `init-apps` do). To make `hanzo-finance` reconcile on every IAM boot,
add this entry to IAM's `init_data.json` `applications[]` (mechanism c —
`object/init_data.go` `initDefinedApplication`), which merges on boot under
`IAM_PROVISION_ON_BOOT`.

## Verify the flow (no "Invalid client_id")

```bash
# A registered client → the authorize endpoint 302s to the hosted login (NOT a JSON
# "Invalid client_id"). An unregistered client → the error.
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  'https://iam.hanzo.ai/v1/iam/oauth/authorize?client_id=hanzo-finance&response_type=code&scope=openid%20profile%20email&redirect_uri=https%3A%2F%2Ffinance.hanzo.ai%2Fauth%2Fcallback&state=hanzo-finance&code_challenge=TEST&code_challenge_method=S256'
```

## OAuth endpoints (canonical, no `/api/` prefix)

- authorize: `GET  https://iam.hanzo.ai/v1/iam/oauth/authorize`
- token:     `POST https://iam.hanzo.ai/v1/iam/oauth/token`
- refresh:   `POST https://iam.hanzo.ai/v1/iam/oauth/refresh_token`
- userinfo:  `GET  https://iam.hanzo.ai/v1/iam/oauth/userinfo`

The app fields live in `hanzo-finance.json` (this dir). Brand variants
(`lux-finance` @ lux.id, `zoo-finance` @ zoolabs.id) mirror this with their own
issuer/redirect when those hosts go live.
