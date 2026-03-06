import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  images: {
    domains: ["picsum.photos", "images.unsplash.com", "res.cloudinary.com"],
    // Or use `remotePatterns` if you need finer control:
    // remotePatterns: [
    //   { protocol: "https", hostname: "picsum.photos" },
    //   { protocol: "https", hostname: "images.unsplash.com" },
    //   { protocol: "https", hostname: "res.cloudinary.com" },
    // ],
  },
};

export default nextConfig;
