import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
  turbopack: {},
};

const pwaConfig = withPWA({
  pwa: {
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    dest: "public",
  },
} as any);

// @ts-expect-error next-pwa types are incompatible with Next.js 16
export default pwaConfig(nextConfig);
