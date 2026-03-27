"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/version";

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

type Me = {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolMe;
};

const linkNav =
  "text-xs font-medium text-blue-100/95 transition-colors hover:text-white sm:text-sm";

export function BarraNavegacion() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const ultimoPingRef = useRef(0);

  const cargarMe = useCallback(async () => {
    if (pathname === "/login") {
      setMe(null);
      return;
    }
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setMe(null);
        return;
      }
      const data = (await response.json()) as Me;
      setMe(data);
    } catch {
      setMe(null);
    }
  }, [pathname]);

  useEffect(() => {
    void cargarMe().catch(() => setMe(null));
  }, [cargarMe]);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    const eventos: (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    const onActividad = () => {
      const ahora = Date.now();
      // Evita rafagas: como maximo un ping por minuto.
      if (ahora - ultimoPingRef.current < 60_000) {
        return;
      }
      ultimoPingRef.current = ahora;
      void fetch("/api/auth/me", { cache: "no-store" }).catch(() => undefined);
    };

    for (const e of eventos) {
      window.addEventListener(e, onActividad, { passive: true });
    }
    return () => {
      for (const e of eventos) {
        window.removeEventListener(e, onActividad);
      }
    };
  }, [pathname]);

  async function cerrarSesion() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Aun asi mandamos al login para no dejar la UI colgada
    }
    window.location.assign("/login");
  }

  if (pathname === "/login") {
    return (
      <header className="login-plain-header border-b border-blue-950/20 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg shadow-blue-950/20">
        <nav className="login-plain-header-inner nav-barra-oneline max-w-5xl">
          <div className="flex min-w-0 flex-nowrap items-center gap-x-3">
            <span className="login-plain-header-title whitespace-nowrap text-base font-bold leading-none tracking-tight text-white sm:text-lg">
              Departamento Legal y Notarial{" "}
              <span className="font-semibold text-blue-100">— Acceso</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-blue-200/90" title={`Versión ${APP_VERSION}`}>
              v{APP_VERSION}
            </span>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="login-plain-header border-b border-blue-950/20 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg shadow-blue-950/20">
      <nav className="login-plain-header-inner nav-barra-oneline flex w-full max-w-5xl flex-nowrap items-center gap-x-2 overflow-x-auto overflow-y-hidden md:gap-x-3">
        <Link
          className="login-plain-brand min-w-0 shrink-0 font-bold leading-tight tracking-tight text-white sm:whitespace-nowrap sm:leading-none md:text-base"
          href="/"
          title="Departamento Legal y Notarial"
        >
          <span className="block max-w-[11rem] truncate text-xs sm:hidden">
            Dpto. Legal y Notarial
          </span>
          <span className="hidden text-sm sm:inline">Departamento Legal y Notarial</span>
        </Link>
        <span className="hidden h-5 w-px shrink-0 bg-blue-400/40 sm:block" aria-hidden />
        <div className="flex shrink-0 flex-nowrap items-center gap-x-3 md:gap-x-4">
          <Link className={`${linkNav} whitespace-nowrap`} href="/asuntos">
            Asuntos
          </Link>
          <Link className={`${linkNav} whitespace-nowrap`} href="/clientes" title="Directorio de clientes">
            Clientes
          </Link>
          {me?.rol === "ADMIN" ? (
            <Link className={`${linkNav} whitespace-nowrap`} href="/maestros">
              Socios y Equipo
            </Link>
          ) : null}
          {me?.rol === "ADMIN" ? (
            <Link className={`${linkNav} whitespace-nowrap`} href="/admin/usuarios">
              Usuarios
            </Link>
          ) : null}
        </div>
        <span className="min-w-2 shrink grow basis-0" aria-hidden />
        <div className="flex shrink-0 flex-nowrap items-center gap-x-2 md:gap-x-3">
          <span
            className="shrink-0 text-[10px] font-medium leading-none text-blue-200/80 whitespace-nowrap sm:text-xs"
            title={`Versión ${APP_VERSION}`}
          >
            v{APP_VERSION}
          </span>
          {me ? (
            <span className="hidden max-w-[10rem] truncate text-sm text-blue-100/90 md:inline lg:max-w-[14rem]">
              {me.nombre} <span className="text-blue-300/80">({me.usuario})</span>
            </span>
          ) : me === undefined ? (
            <span className="text-sm text-blue-200/80 whitespace-nowrap">...</span>
          ) : null}
          <button
            className="login-plain-logout shrink-0 rounded-lg border border-blue-400/50 bg-blue-950/30 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-950/50 sm:px-2.5 sm:text-sm md:px-3 md:py-1.5"
            type="button"
            onClick={() => void cerrarSesion().catch(() => window.location.assign("/login"))}
          >
            Salir
          </button>
        </div>
      </nav>
    </header>
  );
}
