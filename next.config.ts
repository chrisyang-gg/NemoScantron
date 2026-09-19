import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/scan", destination: "/", permanent: false },
      { source: "/how-it-works", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
