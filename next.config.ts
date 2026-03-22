import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * En `next dev`, Next bloquea orígenes que no sean localhost (seguridad).
   * Sin esto, túneles (ngrok, cloudflared, etc.) suelen fallar: la página carga mal o sin estilos/JS.
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    "*.loca.lt",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
