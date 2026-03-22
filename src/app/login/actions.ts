"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSION, SESSION_MAX_AGE } from "@/lib/auth-constants";
import { ejecutarLoginServidor } from "@/lib/login-servidor";

export type EstadoLoginAccion = { error: string } | null;

/**
 * Login por Server Action: sin fetch al API → no hay respuesta HTML ni JSON roto en el cliente.
 */
export async function accionIniciarSesion(
  _prev: EstadoLoginAccion,
  formData: FormData,
): Promise<EstadoLoginAccion> {
  const usuario = String(formData.get("usuario") ?? "");
  const password = String(formData.get("password") ?? "");

  const r = await ejecutarLoginServidor(usuario, password);
  if (r.tipo === "error") {
    return { error: r.mensaje };
  }

  const jar = await cookies();
  jar.set(COOKIE_SESSION, r.token, {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}
