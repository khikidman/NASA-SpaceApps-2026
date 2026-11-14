import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  agentRules: false,
  distDir: process.env.SPACEAPPS_ASSET_LAB === "1" ? ".next-lab" : ".next",
  turbopack: { root: process.cwd() },
};

export default nextConfig;
