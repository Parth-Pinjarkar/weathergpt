import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use standalone output for Docker containers, not on Vercel
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
};

export default nextConfig;
