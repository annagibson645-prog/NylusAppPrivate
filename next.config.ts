import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow fs reads from vault at build time
  serverExternalPackages: ["gray-matter"],
};

export default nextConfig;
