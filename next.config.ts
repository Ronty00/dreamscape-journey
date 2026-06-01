import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for heavy Three.js + Framer Motion experience
  reactStrictMode: true,
  
  // Better bundle optimization
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei', 'framer-motion', 'lucide-react'],
  },

  // Production performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Ensure good WebGL / Audio compatibility
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;