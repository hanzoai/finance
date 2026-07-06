import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Hanzo Finance web — Next.js config.
 *
 * The shared @hanzo/finance-ui board is now built on the canonical @hanzo/ui (dashboard)
 * → @hanzo/gui (Tamagui) stack, consumed at RUNTIME (no optimizing compiler): the Gui
 * ESM/TSX source packages are transpiled by Next's `transpilePackages` and `GuiProvider`
 * injects CSS at runtime — exactly how the console consumes them. `react-native` is
 * aliased to `react-native-web` for the browser.
 */

/** Every installed `@hanzogui/*` package, discovered (not hardcoded), plus the source
 *  packages (@hanzo/gui / @hanzo/ui / @hanzo/data / @hanzo/finance-ui) that ship TSX. */
function guiPackages() {
  const dir = join(__dirname, 'node_modules', '@hanzogui')
  let scoped = []
  try {
    scoped = readdirSync(dir).map((name) => `@hanzogui/${name}`)
  } catch {
    scoped = []
  }
  return ['@hanzo/gui', '@hanzo/ui', '@hanzo/data', '@hanzo/finance-ui', 'react-native-web', ...scoped]
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lean, self-contained server for the container image. `outputFileTracingRoot`
  // points at the pnpm-workspace root so the traced bundle includes the linked
  // @hanzo/finance-ui package (and the hoisted @hanzogui/* graph).
  output: 'standalone',
  outputFileTracingRoot: join(__dirname, '..'),
  transpilePackages: guiPackages(),
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    esmExternals: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? '0.1.0',
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
    }
    // Gui resolves web-specific implementations via `.web.*` first.
    config.resolve.extensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', ...config.resolve.extensions]
    return config
  },
}

export default nextConfig
