import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lean, self-contained server for the container image. `outputFileTracingRoot`
  // points at the pnpm-workspace root so the traced bundle includes the linked
  // @hanzo/finance-ui package.
  output: 'standalone',
  outputFileTracingRoot: join(__dirname, '..'),
  // The shared finance UI ships compiled ESM; transpiling it keeps a workspace-linked
  // build robust across Next's server/client boundary.
  transpilePackages: ['@hanzo/finance-ui'],
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? '0.1.0',
  },
}

export default nextConfig
