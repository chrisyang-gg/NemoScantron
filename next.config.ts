import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  ...(githubPages
    ? {
        output: "export" as const,
        basePath: "/NemoScantron",
        assetPrefix: "/NemoScantron",
        trailingSlash: true,
      }
    : {
        async redirects() {
          return [
            { source: "/scan", destination: "/", permanent: false },
            { source: "/how-it-works", destination: "/", permanent: false },
          ];
        },
      }),
};

export default nextConfig;
