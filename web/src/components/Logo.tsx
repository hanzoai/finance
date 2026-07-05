import * as React from 'react'

/**
 * The canonical Hanzo mark (viewBox "0 0 67 67", the exact `44.6369` geometry from
 * `@hanzo/logo` dist). Never hand-drawn — this is the dist SVG, parameterized to
 * `currentColor` so it reads white on dark and black on light. The two bevel paths use
 * a muted tone via opacity.
 */
export function HanzoMark({ size = 26, className }: { size?: number; className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 67 67"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Hanzo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22.21 67V44.6369H0V67H22.21Z" fill="currentColor" />
      <path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="currentColor" opacity={0.55} />
      <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="currentColor" />
      <path d="M22.21 0H0V22.3184H22.21V0Z" fill="currentColor" />
      <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="currentColor" />
      <path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="currentColor" opacity={0.55} />
      <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="currentColor" />
    </svg>
  )
}

/** Brand lockup: the mark + "<Brand> · Finance" wordmark. */
export function BrandLockup({ brand, product }: { brand: string; product?: string }): React.JSX.Element {
  return (
    <span className="fin-brand">
      <HanzoMark className="fin-mark" />
      <span>
        {brand} <span className="fin-brand-sub">{product ?? 'Finance'}</span>
      </span>
    </span>
  )
}
