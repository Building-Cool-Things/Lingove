import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server opened from another device on the LAN (phone, other PC).
  allowedDevOrigins: ["192.168.1.3","https://lingove2.vercel.app"],
};

export default nextConfig;
