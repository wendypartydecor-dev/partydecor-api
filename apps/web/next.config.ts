import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@aurea/ui', '@aurea/core', '@aurea/auth'],
  experimental: {
    turbo: {
      resolveAlias: {
        '@aurea/ui': '../packages/ui',
        '@aurea/core': '../packages/core',
        '@aurea/auth': '../packages/auth',
      },
    },
  },
};

export default nextConfig;
