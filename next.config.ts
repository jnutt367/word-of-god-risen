import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Characters routes unified Nov 9, 2026 (whole-Bible layout): the old
  // /characters/mark/<slug> and /characters/heavenly/<slug> addresses
  // permanently redirect to the one /characters/<slug> route, so no
  // shared link ever dies.
  async redirects() {
    return [
      {
        source: "/characters/mark/:slug",
        destination: "/characters/:slug",
        permanent: true,
      },
      {
        source: "/characters/heavenly/:slug",
        destination: "/characters/:slug",
        permanent: true,
      },
    ];
  },
  // Walk the Farm (Gather the Flock) is a self-contained static page
  // in public/walk-the-farm/; its bare route resolves to its index.
  async rewrites() {
    return [
      { source: "/walk-the-farm", destination: "/walk-the-farm/index.html" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
