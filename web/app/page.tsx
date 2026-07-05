'use client'

import { FinanceDashboard, stubFinanceClient } from '@hanzo/finance-ui'
import { config } from '~/config'
import { startSignin } from '~/lib/auth/iam'
import { BrandLockup, HanzoMark } from '~/components/Logo'

const FEATURES = [
  {
    icon: '⇄',
    title: 'Double-entry ledger',
    body: 'Every movement posts to an append-only, always-balanced ledger on per-tenant Hanzo Base. Books reconcile by construction — the reserve can never over-mint.',
  },
  {
    icon: '⌁',
    title: 'Payment connectors',
    body: 'One connector API over cards, HUSD, and cash rails. Metered spend, credits, top-ups, and payouts flow through a single money surface.',
  },
  {
    icon: '◈',
    title: 'Treasury & reserve',
    body: 'A backed reserve behind credits and payouts, hashed and anchored on the Hanzo L1 — EVM-auditable, immutable, reconciled to the penny.',
  },
]

const FACTS = [
  { v: '1', l: 'Unified ledger' },
  { v: '50+', l: 'Payment processors' },
  { v: '100%', l: 'Reconciled by construction' },
  { v: 'USD ¢', l: 'Exact, never a float' },
]

export default function LandingPage(): React.JSX.Element {
  const onStart = () => {
    void startSignin(config.appPath)
  }
  return (
    <>
      <nav className="fin-nav">
        <div className="fin-container fin-nav-inner">
          <BrandLockup brand={config.brandName} />
          <div className="fin-nav-actions">
            <a className="fin-btn fin-btn--ghost" href={config.homepage} target="_blank" rel="noreferrer">
              {config.brandName}
            </a>
            <button className="fin-btn" onClick={onStart}>
              Sign in
            </button>
            <button className="fin-btn fin-btn--primary" onClick={onStart}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      <header className="fin-hero">
        <div className="fin-container">
          <span className="fin-eyebrow">
            <span className="fin-dot" /> Native financial core, embedded in Hanzo Cloud
          </span>
          <h1>One ledger for your money operations.</h1>
          <p>
            {config.productName} is a double-entry ledger, payment connectors, and a treasury dashboard — so you can run
            your organization’s credits, payouts, and reserves on books that balance by construction.
          </p>
          <div className="fin-hero-cta">
            <button className="fin-btn fin-btn--primary fin-btn--lg" onClick={onStart}>
              Get started
            </button>
            <a className="fin-btn fin-btn--lg" href="#product">
              See the platform
            </a>
          </div>
          <div className="fin-hero-note">Sign in with Hanzo IAM · single sign-on across every Hanzo product</div>
        </div>

        <div className="fin-container fin-preview" id="product">
          <div className="fin-preview-frame">
            <div className="fin-preview-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="fin-preview-body">
              <div style={{ padding: 18 }}>
                <FinanceDashboard client={stubFinanceClient()} mode="preview" theme="dark" showTreasury />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="fin-section">
        <div className="fin-container">
          <div className="fin-section-head">
            <h2>Everything money touches, in one place</h2>
            <p>Formance ported native — one Go binary on Base, not five microservices. The books are the source of truth.</p>
          </div>
          <div className="fin-grid-3">
            {FEATURES.map((f) => (
              <div className="fin-feature" key={f.title}>
                <div className="fin-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fin-section">
        <div className="fin-container">
          <div className="fin-metrics">
            {FACTS.map((m) => (
              <div className="fin-metric" key={m.l}>
                <div className="fin-metric-v">{m.v}</div>
                <div className="fin-metric-l">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fin-section fin-cta">
        <div className="fin-container">
          <h2>Bring your books onto Hanzo.</h2>
          <p>Sign in with your Hanzo account — your organization’s finances, scoped to you.</p>
          <button className="fin-btn fin-btn--primary fin-btn--lg" onClick={onStart}>
            Get started
          </button>
        </div>
      </section>

      <footer className="fin-footer">
        <div className="fin-container fin-footer-inner">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <HanzoMark size={18} />
            {config.productName} · © {new Date().getFullYear()} Hanzo AI
          </span>
          <div className="fin-footer-links">
            <a href={config.homepage} target="_blank" rel="noreferrer">
              {config.brandName}
            </a>
            <a href="https://docs.hanzo.ai" target="_blank" rel="noreferrer">
              Docs
            </a>
            <button className="fin-btn fin-btn--ghost" style={{ padding: 0 }} onClick={onStart}>
              Sign in
            </button>
          </div>
        </div>
      </footer>
    </>
  )
}
