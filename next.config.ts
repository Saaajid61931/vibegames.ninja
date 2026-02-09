import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Use Cloudflare's image loader instead of Next.js default
    // This avoids the resvg WASM issue on Windows builds
    loader: "custom",
    loaderFile: "./src/lib/cloudflare-image-loader.ts",
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
