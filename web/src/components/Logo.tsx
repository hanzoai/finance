import * as React from 'react'
import { HanzoMark } from '@hanzo/ui/product'

/**
 * The brand chrome for finance.hanzo.ai.
 *
 * The mark itself is NOT drawn here — it is `@hanzo/ui/product`'s `HanzoMark`, the one
 * canonical 7-path glyph (geometry canon: `@hanzo/logo` `MARK_PATHS`). A second copy of
 * those paths in this repo is a second mark that silently drifts from the console's, so
 * there isn't one. Only the finance-specific lockup lives here.
 */
export { HanzoMark }

/** Brand lockup: the mark + "<Brand> · Finance" wordmark. */
export function BrandLockup({ brand, product }: { brand: string; product?: string }): React.JSX.Element {
  return (
    <span className="fin-brand">
      <HanzoMark size={26} />
      <span>
        {brand} <span className="fin-brand-sub">{product ?? 'Finance'}</span>
      </span>
    </span>
  )
}
