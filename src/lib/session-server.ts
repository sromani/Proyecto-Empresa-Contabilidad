import { cookies } from "next/headers";
import { COOKIE_SESSION } from "@/lib/auth-constants";
import { verificarTokenSesion, type PayloadSesion } from "@/lib/session-token";

export async function obtenerSesionServidor(): Promise<PayloadSesion | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSION)?.value;
  if (!token) {
    return null;
  }
  return verificarTokenSesion(token);
}

export async function requiereSesion(): Promise<PayloadSesion> {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    throw new Error("No autorizado");
  }
  return sesion;
}

export async function requiereAdmin(): Promise<PayloadSesion> {
  const sesion = await requiereSesion();
  if (sesion.rol !== "ADMIN") {
    throw new Error("Solo administradores");
  }
  return sesion;
}
