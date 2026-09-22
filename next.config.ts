import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/visits/*/story": ["./lib/share/fonts/**/*"],
    "/api/year-in-review/story/*": ["./lib/share/fonts/**/*"],
    "/api/visits/*/story/video": [
      "./lib/share/fonts/**/*",
      "./node_modules/.pnpm/ffmpeg-static@*/node_modules/ffmpeg-static/ffmpeg",
    ],
  },
};

export default nextConfig;
