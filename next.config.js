/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'goalsquad.shop'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Ignore mobile directory during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/mobile/**'],
    };
    return config;
  },
}

module.exports = nextConfig
