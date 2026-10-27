import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
