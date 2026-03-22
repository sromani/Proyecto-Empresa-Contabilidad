import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obtenerSesionServidor } from "@/lib/session-server";

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    redirect("/login");
  }
  if (sesion.rol !== "ADMIN") {
    redirect("/");
  }
  return <>{children}</>;
}
