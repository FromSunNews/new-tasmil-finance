import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@copilotkit/runtime"],
  reactStrictMode: false,
  typescript: {
    // Ignore TypeScript errors during build for generated files
    ignoreBuildErrors: false,
    // Custom TypeScript configuration
    tsconfigPath: './tsconfig.json',
  },
  // Use Turbopack configuration instead of webpack
  turbopack: {
    // Empty config to silence the warning
  },
};

export default nextConfig;
