import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { hostname: "as2.ftcdn.net", protocol: "https", pathname: "/**" },
      {
        hostname: "firebasestorage.googleapis.com",
        protocol: "https",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "posecomnew.firebasestorage.app",
      },
    ],
  },
};

export default nextConfig;
