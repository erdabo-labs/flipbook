import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] }];
  },
};

export default nextConfig;
