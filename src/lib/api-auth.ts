import { NextResponse } from "next/server";
import { obtenerSesionServidor } from "@/lib/session-server";
import type { PayloadSesion } from "@/lib/session-token";
import { puedeGestionarMaestrosEstudio } from "@/lib/roles-app";

export type ResultadoApiSesion =
  | { ok: true; sesion: PayloadSesion }
  | { ok: false; response: NextResponse };

/**
 * Verificacion de sesion en rutas API (runtime Node).
 * El middleware solo comprueba que exista la cookie; la firma JWT se valida aca.
 */
export async function requiereApiSesion(): Promise<ResultadoApiSesion> {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado. Inicia sesion." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, sesion };
}

export type ResultadoApiSesionMaestros =
  | { ok: true; sesion: PayloadSesion }
  | { ok: false; response: NextResponse };

/** Socios / profesionales: solo ADMIN o SOCIO */
export async function requiereApiMaestrosEstudio(): Promise<ResultadoApiSesionMaestros> {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth;
  }
  if (!puedeGestionarMaestrosEstudio(auth.sesion.rol)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado. Solo administradores o socios pueden gestionar el catalogo." },
        { status: 403 },
      ),
    };
  }
  return auth;
}
