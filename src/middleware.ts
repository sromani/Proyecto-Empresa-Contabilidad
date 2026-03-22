import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESSION } from "@/lib/auth-constants";

function respuestaApiNoAutorizada() {
  return NextResponse.json({ error: "No autorizado. Inicia sesion." }, { status: 401 });
}

/**
 * El Middleware corre en Edge: NO verificamos JWT aca (jose/secret suelen fallar o desincronizar).
 * Solo comprobamos presencia de cookie; la firma se valida en Node (layout (protegido) y rutas API).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLower = pathname.toLowerCase();

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  if (pathLower === "/api/auth/login" || pathLower.startsWith("/api/auth/login/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth/logout")) {
      return NextResponse.next();
    }

    const tokenApi = request.cookies.get(COOKIE_SESSION)?.value;
    if (!tokenApi) {
      return respuestaApiNoAutorizada();
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESSION)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
