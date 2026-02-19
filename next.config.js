/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  distDir: '.next',
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  // Allow reading files from home directory for logs
  experimental: {
    serverComponentsExternalPackages: ['fs', 'path']
  }
}

module.exports = nextConfig
