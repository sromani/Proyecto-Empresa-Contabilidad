import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * `allowedDevOrigins` existía en Next 15.2; en 15.5+ dejó de reconocerse en `next.config`
   * y generaba aviso en build/servidor. Para túneles en dev, revisá la doc actual de Next.js.
   */
};

export default nextConfig;
