import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '..'),
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
  // Reliable file watching on Windows (avoids stale/missing CSS chunks in dev)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && process.platform === 'win32') {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
