import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSION, SESSION_MAX_AGE, sessionCookieSecure } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { obtenerSesionServidor } from "@/lib/session-server";

export async function GET() {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.sub },
    select: { id: true, usuario: true, nombre: true, rol: true, activo: true },
  });

  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: "Usuario no disponible." }, { status: 401 });
  }

  const response = NextResponse.json(usuario, {
    headers: { "Cache-Control": "no-store" },
  });

  // Sliding session: cada uso valido renueva el timeout de inactividad.
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSION)?.value;
  if (token) {
    response.cookies.set(COOKIE_SESSION, token, {
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
      sameSite: "lax",
      secure: sessionCookieSecure(),
    });
  }

  return response;
}
