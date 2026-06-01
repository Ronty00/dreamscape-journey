import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Force Webpack instead of Turbopack.
  // This project is too heavy for Turbopack and causes "Call retries exceeded" on Vercel.
  turbopack: {},

  // Force standalone output (recommended for Vercel)
  output: 'standalone',

  // Help with large Three.js bundles
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  // Bundle optimizations for Three.js projects
  experimental: {
    optimizePackageImports: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'framer-motion',
      'lucide-react',
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } 
      : false,
  },

  webpack: (config, { isServer }) => {
    // Avoid canvas issues in client bundle
    if (!isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }
    return config;
  },
};

export default nextConfig;