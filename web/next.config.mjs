import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Hanzo Finance web — Next.js config.
 *
 * The shared @hanzo/finance-ui board renders on the canonical @hanzo/ui (product layer)
 * → @hanzo/gui (Tamagui primitives) stack, consumed at RUNTIME (no optimizing compiler):
 * `GuiProvider` injects its CSS on mount — exactly how the console consumes them.
 *
 * As of 8.x, `@hanzo/gui` and every `@hanzogui/*` package ship BUILT dist (cjs + esm),
 * so Next resolves them directly. Only the two packages that publish raw TypeScript
 * source still need `transpilePackages`; the readdirSync sweep of ~114 `@hanzogui/*`
 * directories that used to feed it is gone with them.
 *
 * `react-native` is aliased to `react-native-web` for the browser — react-native-svg,
 * which the @hanzo/ui icon set imports, resolves through it.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lean, self-contained server for the container image. `outputFileTracingRoot`
  // points at the pnpm-workspace root so the traced bundle includes the linked
  // @hanzo/finance-ui package (and the hoisted @hanzo/* graph).
  output: 'standalone',
  outputFileTracingRoot: join(__dirname, '..'),
  transpilePackages: ['@hanzo/finance-ui', '@hanzo/data'],
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
