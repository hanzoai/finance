/**
 * finance.hanzo.ai runtime config. One app, white-labelled by host like the console:
 * the brand (and its IAM issuer) resolve from the request hostname, so the same image
 * serves finance.hanzo.ai / finance.lux.cloud / finance.zoo.cloud. Login uses the
 * per-brand `<org>-finance` OAuth app (Hanzo IAM, NOT Casdoor). `NEXT_PUBLIC_*`
 * overrides any field per deploy.
 *
 * Everything above the divider is derived from the HOST, so the browser can compute it.
 * Anything derived from the ENVIRONMENT lives below the divider and is read on the
 * server — see `financeMode`.
 */
const trimSlash = (s: string) => s.replace(/\/+$/, '')

export type BrandId = 'hanzo' | 'lux' | 'zoo'

type Brand = {
  brandName: string
  productName: string
  iamUrl: string
  iamOrg: string
  /** OAuth app/client — the <org>-finance app registered in IAM. */
  iamApp: string
  homepage: string
}

const BRANDS: Record<BrandId, Brand> = {
  hanzo: { brandName: 'Hanzo', productName: 'Hanzo Finance', iamUrl: 'https://hanzo.id', iamOrg: 'hanzo', iamApp: 'hanzo-finance', homepage: 'https://hanzo.ai' },
  lux: { brandName: 'Lux', productName: 'Lux Finance', iamUrl: 'https://lux.id', iamOrg: 'lux', iamApp: 'lux-finance', homepage: 'https://lux.network' },
  zoo: { brandName: 'Zoo', productName: 'Zoo Finance', iamUrl: 'https://zoolabs.id', iamOrg: 'zoo', iamApp: 'zoo-finance', homepage: 'https://zoo.ngo' },
}

const HOST_BRANDS: ReadonlyArray<{ suffix: string; brand: BrandId }> = [
  { suffix: 'hanzo.ai', brand: 'hanzo' },
  { suffix: 'lux.cloud', brand: 'lux' },
  { suffix: 'lux.network', brand: 'lux' },
  { suffix: 'zoo.cloud', brand: 'zoo' },
  { suffix: 'zoo.ngo', brand: 'zoo' },
]

export function brandFromHost(host?: string | null): BrandId {
  const h = (host ?? '').toLowerCase().replace(/:\d+$/, '').trim()
  for (const e of HOST_BRANDS) if (h === e.suffix || h.endsWith('.' + e.suffix)) return e.brand
  return 'hanzo'
}

function currentHost(): string {
  if (typeof window !== 'undefined') return window.location.hostname
  return process.env.NEXT_PUBLIC_DEFAULT_HOST ?? 'finance.hanzo.ai'
}

export type FinanceConfig = {
  brand: BrandId
  brandName: string
  productName: string
  iamUrl: string
  iamOrg: string
  iamClientId: string
  homepage: string
  /** Where the app shell lives (post-login). */
  appPath: string
  /** OAuth callback path — must match the app's registered redirect_uri. */
  callbackPath: string
}

export function resolveConfig(host?: string | null): FinanceConfig {
  const h = host ?? currentHost()
  const brand = brandFromHost(h)
  const b = BRANDS[brand]
  return {
    brand,
    brandName: b.brandName,
    productName: process.env.NEXT_PUBLIC_PRODUCT_NAME ?? b.productName,
    iamUrl: trimSlash(process.env.NEXT_PUBLIC_IAM_URL ?? b.iamUrl),
    iamOrg: process.env.NEXT_PUBLIC_IAM_ORG ?? b.iamOrg,
    iamClientId: process.env.NEXT_PUBLIC_IAM_CLIENT_ID ?? b.iamApp,
    homepage: b.homepage,
    appPath: '/app',
    callbackPath: '/auth/callback',
  }
}

/** Brand-aware config resolved from the current host on read. */
export const config: FinanceConfig = new Proxy({} as FinanceConfig, {
  get: (_t, k: string) => resolveConfig()[k as keyof FinanceConfig],
})

// ── server-only ───────────────────────────────────────────────────────────
export type Mode = 'live' | 'preview'

/**
 * Which data the signed-in shell reads: `live` = the org's real `/v1/finance/*`,
 * `preview` = the illustrative stub. Read on the server, per request, and handed to the
 * browser as a prop (`app/app/page.tsx`) — a `NEXT_PUBLIC_*` read is inlined into the
 * client bundle when the image is BUILT, which freezes one image to one environment.
 * Live is the default: a signed-in user gets an honest error before invented money.
 */
export const financeMode = (): Mode => (process.env.FINANCE_MODE === 'preview' ? 'preview' : 'live')

/** IAM issuer used server-side by the BFF (token exchange). Falls back to the client default. */
export const serverIamUrl = () => trimSlash(process.env.IAM_URL ?? process.env.NEXT_PUBLIC_IAM_URL ?? 'https://hanzo.id')
/** Cloud API base the /v1/finance BFF forwards to (gated api.hanzo.ai). */
export const cloudApiUrl = () => trimSlash(process.env.CLOUD_API_URL ?? 'https://api.hanzo.ai')
