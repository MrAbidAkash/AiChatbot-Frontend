import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["chattimeai.com", "*.chattimeai.com", "localhost:3000"],
    },
  },
};

export default nextConfig;
