import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obtenerSesionServidor } from "@/lib/session-server";
import { puedeGestionarMaestrosEstudio } from "@/lib/roles-app";

export default async function LayoutMaestros({ children }: { children: ReactNode }) {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    redirect("/login");
  }
  if (!puedeGestionarMaestrosEstudio(sesion.rol)) {
    redirect("/");
  }
  return <>{children}</>;
}
