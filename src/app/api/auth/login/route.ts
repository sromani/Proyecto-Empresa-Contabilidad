import { NextResponse } from "next/server";
import { COOKIE_SESSION, SESSION_MAX_AGE, sessionCookieSecure } from "@/lib/auth-constants";
import { ejecutarLoginServidor } from "@/lib/login-servidor";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status: number) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Cuerpo JSON invalido." }, 400);
  }

  const b = body as Record<string, unknown>;
  const usuario = String(b?.usuario ?? "");
  const password = String(b?.password ?? "");

  const r = await ejecutarLoginServidor(usuario, password);
  if (r.tipo === "error") {
    return jsonResponse({ error: r.mensaje }, r.status);
  }

  const response = jsonResponse(
    {
      ok: true,
      usuario: r.usuario,
      nombre: r.nombre,
      rol: r.rol,
    },
    200,
  );

  response.cookies.set(COOKIE_SESSION, r.token, {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    secure: sessionCookieSecure(),
  });

  return response;
}
