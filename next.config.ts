import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server opened from another device on the LAN (phone, other PC).
  allowedDevOrigins: ["192.168.1.3"],
};

export default nextConfig;
