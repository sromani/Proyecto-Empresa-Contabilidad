import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { BarraNavegacion } from "@/components/barra-navegacion";

export const metadata: Metadata = {
  title: "Estudio Legal/Notarial UY",
  description: "Sistema de gestion de clientes y asuntos",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className="app-text">
        <BarraNavegacion />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
