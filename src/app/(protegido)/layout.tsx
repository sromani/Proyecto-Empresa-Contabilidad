import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obtenerSesionServidor } from "@/lib/session-server";

/**
 * Rutas bajo (protegido) se validan en Node (no en Middleware Edge).
 * Asi la verificacion JWT usa el mismo runtime que el login.
 */
export default async function LayoutProtegido({ children }: { children: ReactNode }) {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    redirect("/login");
  }
  return <>{children}</>;
}
