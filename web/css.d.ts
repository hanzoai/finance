/**
 * Plain (non-module) stylesheet side-effect imports — `import '@hanzo/ui/theme.css'`.
 * Next.js only declares `*.module.css`, and TypeScript 7 (tsgo) rejects a side-effect
 * import of a module it cannot resolve (TS2882) where tsc silently allowed it.
 */
declare module '*.css'
