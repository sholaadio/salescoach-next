import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Optimize images from the Render backend
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "salescoach-server.onrender.com",
      },
    ],
  },

  // Headers for PWA/Capacitor compatibility
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff"          },
          { key: "X-Frame-Options",            value: "SAMEORIGIN"       },
          { key: "X-XSS-Protection",           value: "1; mode=block"    },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
