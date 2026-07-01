import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '250mb',
    },
    middlewareClientMaxBodySize: '250mb',
  },
};

export default nextConfig;
