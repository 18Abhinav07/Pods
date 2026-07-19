import type { NextConfig } from "next";

const lanDevelopmentHost = process.env.PODS_LAN_HOST ?? "192.168.29.244";

const nextConfig: NextConfig = {
  allowedDevOrigins: [lanDevelopmentHost],
  serverExternalPackages: ["@nimiq/core"]
};

export default nextConfig;
