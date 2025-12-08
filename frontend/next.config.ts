import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Disable React strict mode for development to prevent double effects
  reactStrictMode: true,
};

export default nextConfig;
