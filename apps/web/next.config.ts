import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output needs symlinks; enable explicitly in Docker builds.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  transpilePackages: [
    "@innate/contracts",
    "@innate/openmaic-adapter",
    "@innate/deeptutor-adapter",
  ],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
