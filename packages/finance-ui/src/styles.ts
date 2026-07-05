/**
 * The finance-ui stylesheet — ONE monochrome design system, scoped under `.hz-fin`,
 * injected once by `<FinanceStyles/>`. Self-contained (no external CSS import, no
 * bundler config) so a card renders byte-identically in every host. Theme-aware:
 * light by default, dark via `prefers-color-scheme` OR an explicit `data-theme` on the
 * `.hz-fin` root (the host's theme toggle wins in both directions).
 */

export const FINANCE_CSS = `
.hz-fin {
  --fin-bg: #ffffff;
  --fin-surface: #ffffff;
  --fin-surface-2: #f6f6f7;
  --fin-border: #e6e6e8;
  --fin-border-strong: #d3d3d6;
  --fin-text: #0a0a0a;
  --fin-muted: #6b6b70;
  --fin-faint: #9a9aa0;
  --fin-neg: #b23c3c;
  --fin-pos: #2f7d43;
  --fin-accent: #0a0a0a;
  --fin-accent-contrast: #ffffff;
  --fin-radius: 14px;
  --fin-radius-sm: 9px;
  color: var(--fin-text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
  font-feature-settings: "tnum" 1, "cv01" 1;
  -webkit-font-smoothing: antialiased;
  line-height: 1.45;
}
@media (prefers-color-scheme: dark) {
  .hz-fin:not([data-theme="light"]) {
    --fin-bg: #0a0a0b;
    --fin-surface: #141416;
    --fin-surface-2: #1b1b1e;
    --fin-border: #262629;
    --fin-border-strong: #34343a;
    --fin-text: #f4f4f5;
    --fin-muted: #a1a1a8;
    --fin-faint: #6e6e76;
    --fin-neg: #e0736f;
    --fin-pos: #6fca87;
    --fin-accent: #f4f4f5;
    --fin-accent-contrast: #0a0a0b;
  }
}
.hz-fin[data-theme="dark"] {
  --fin-bg: #0a0a0b;
  --fin-surface: #141416;
  --fin-surface-2: #1b1b1e;
  --fin-border: #262629;
  --fin-border-strong: #34343a;
  --fin-text: #f4f4f5;
  --fin-muted: #a1a1a8;
  --fin-faint: #6e6e76;
  --fin-neg: #e0736f;
  --fin-pos: #6fca87;
  --fin-accent: #f4f4f5;
  --fin-accent-contrast: #0a0a0b;
}
.hz-fin, .hz-fin * { box-sizing: border-box; }
.hz-fin .hz-fin-grid { display: grid; gap: 14px; }
.hz-fin .hz-fin-row { display: flex; flex-wrap: wrap; gap: 14px; }
.hz-fin .hz-fin-stack { display: flex; flex-direction: column; gap: 14px; }

.hz-fin .hz-fin-card {
  background: var(--fin-surface);
  border: 1px solid var(--fin-border);
  border-radius: var(--fin-radius);
  padding: 18px 20px;
}
.hz-fin .hz-fin-card--flush { padding: 0; overflow: hidden; }

.hz-fin .hz-fin-card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: 14px;
}
.hz-fin .hz-fin-card-title { font-size: 13px; font-weight: 600; letter-spacing: 0.01em; }
.hz-fin .hz-fin-card-sub { font-size: 12px; color: var(--fin-muted); margin-top: 2px; }

.hz-fin .hz-fin-stat { flex: 1 1 210px; min-width: 200px; }
.hz-fin .hz-fin-stat-label { font-size: 12px; color: var(--fin-muted); font-weight: 500; display: flex; align-items: center; gap: 7px; }
.hz-fin .hz-fin-stat-value { font-size: 30px; font-weight: 640; letter-spacing: -0.02em; margin-top: 6px; line-height: 1.1; }
.hz-fin .hz-fin-stat-sub { font-size: 12px; color: var(--fin-faint); margin-top: 5px; }
.hz-fin .hz-fin-stat-spark { margin-top: 12px; }

.hz-fin .hz-fin-delta { font-size: 11.5px; font-weight: 600; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--fin-border-strong); display: inline-flex; align-items: center; gap: 3px; }
.hz-fin .hz-fin-delta--up { color: var(--fin-pos); }
.hz-fin .hz-fin-delta--down { color: var(--fin-neg); }
.hz-fin .hz-fin-delta--flat { color: var(--fin-muted); }

.hz-fin .hz-fin-money { font-variant-numeric: tabular-nums; }
.hz-fin .hz-fin-money--neg { color: var(--fin-neg); }
.hz-fin .hz-fin-money--pos { color: var(--fin-pos); }

.hz-fin .hz-fin-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.hz-fin .hz-fin-table th {
  text-align: left; font-weight: 500; color: var(--fin-muted); font-size: 11.5px;
  text-transform: uppercase; letter-spacing: 0.04em; padding: 11px 20px; border-bottom: 1px solid var(--fin-border);
  background: var(--fin-surface-2);
}
.hz-fin .hz-fin-table td { padding: 12px 20px; border-bottom: 1px solid var(--fin-border); vertical-align: middle; }
.hz-fin .hz-fin-table tr:last-child td { border-bottom: none; }
.hz-fin .hz-fin-table .hz-fin-num { text-align: right; font-variant-numeric: tabular-nums; }
.hz-fin .hz-fin-table a { color: var(--fin-text); text-decoration: underline; text-underline-offset: 2px; }

.hz-fin .hz-fin-bar-row { display: grid; grid-template-columns: minmax(90px, 1fr) 3fr auto; align-items: center; gap: 12px; padding: 7px 0; }
.hz-fin .hz-fin-bar-label { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hz-fin .hz-fin-bar-track { height: 8px; background: var(--fin-surface-2); border-radius: 999px; overflow: hidden; }
.hz-fin .hz-fin-bar-fill { height: 100%; background: var(--fin-accent); border-radius: 999px; }
.hz-fin .hz-fin-bar-value { font-size: 13px; font-variant-numeric: tabular-nums; color: var(--fin-muted); }

.hz-fin .hz-fin-pill { font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px; border: 1px solid var(--fin-border-strong); color: var(--fin-muted); text-transform: capitalize; display: inline-block; }
.hz-fin .hz-fin-pill--ok { color: var(--fin-pos); border-color: color-mix(in srgb, var(--fin-pos) 45%, var(--fin-border)); }
.hz-fin .hz-fin-pill--warn { color: var(--fin-neg); border-color: color-mix(in srgb, var(--fin-neg) 45%, var(--fin-border)); }

.hz-fin .hz-fin-seg { display: inline-flex; border: 1px solid var(--fin-border); border-radius: 999px; padding: 2px; gap: 2px; background: var(--fin-surface); }
.hz-fin .hz-fin-seg button { border: none; background: transparent; color: var(--fin-muted); font: inherit; font-size: 12.5px; font-weight: 550; padding: 5px 13px; border-radius: 999px; cursor: pointer; line-height: 1; }
.hz-fin .hz-fin-seg button[aria-pressed="true"] { background: var(--fin-accent); color: var(--fin-accent-contrast); }

.hz-fin .hz-fin-btn { display: inline-flex; align-items: center; gap: 7px; font: inherit; font-size: 13px; font-weight: 560; padding: 8px 15px; border-radius: var(--fin-radius-sm); cursor: pointer; border: 1px solid var(--fin-border-strong); background: var(--fin-surface); color: var(--fin-text); text-decoration: none; }
.hz-fin .hz-fin-btn:hover { border-color: var(--fin-text); }
.hz-fin .hz-fin-btn--primary { background: var(--fin-accent); color: var(--fin-accent-contrast); border-color: var(--fin-accent); }
.hz-fin .hz-fin-btn--primary:hover { opacity: 0.9; border-color: var(--fin-accent); }

.hz-fin .hz-fin-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 9px; padding: 40px 20px; color: var(--fin-muted); }
.hz-fin .hz-fin-state-title { font-size: 14px; font-weight: 600; color: var(--fin-text); }
.hz-fin .hz-fin-state-body { font-size: 13px; max-width: 380px; }

.hz-fin .hz-fin-banner { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--fin-muted); border: 1px dashed var(--fin-border-strong); border-radius: var(--fin-radius-sm); padding: 9px 14px; background: var(--fin-surface-2); }

.hz-fin .hz-fin-skel { position: relative; overflow: hidden; background: var(--fin-surface-2); border-radius: 6px; }
.hz-fin .hz-fin-skel::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--fin-border) 60%, transparent), transparent); animation: hz-fin-shimmer 1.3s infinite; }
@keyframes hz-fin-shimmer { 100% { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .hz-fin .hz-fin-skel::after { animation: none; } }

.hz-fin .hz-fin-muted { color: var(--fin-muted); }
.hz-fin .hz-fin-faint { color: var(--fin-faint); }
.hz-fin .hz-fin-mono { font-variant-numeric: tabular-nums; }
.hz-fin .hz-fin-scroll-x { overflow-x: auto; }
`.trim()
