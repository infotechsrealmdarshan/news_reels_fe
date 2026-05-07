import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Ensure Next.js can properly detect the framework
  experimental: {
    // Add any experimental features if needed
  },
};

export default nextConfig;
