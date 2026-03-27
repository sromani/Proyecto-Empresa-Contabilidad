import "./globals.css";
import "./login-plain.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { BarraNavegacion } from "@/components/barra-navegacion";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "Departamento Legal y Notarial",
  description: `Portal del Departamento Legal y Notarial — clientes y asuntos · v${APP_VERSION}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/** Respaldo si Tailwind/PostCSS no generan CSS en el entorno (p. ej. cwd o caché rota). */
const bodyFallback: React.CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  fontFamily:
    'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  background: "linear-gradient(to bottom right, #f8fafc, #eff6ff 45%, #e0f2fe)",
  color: "#0f172a",
  WebkitFontSmoothing: "antialiased",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body
        style={bodyFallback}
        className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/90 to-sky-100/80 text-slate-900 antialiased"
      >
        <BarraNavegacion />
        <main className="mx-auto min-w-0 max-w-5xl px-3 py-5 sm:px-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
