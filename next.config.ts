import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/visits/*/story": ["./lib/share/fonts/**/*"],
    "/api/year-in-review/story/*": ["./lib/share/fonts/**/*"],
  },
};

export default nextConfig;
