"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
  "text-sm font-medium text-blue-100/95 transition-colors hover:text-white";

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
      <header className="border-b border-blue-950/20 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg shadow-blue-950/20">
        <nav className="mx-auto flex max-w-5xl items-center px-4 py-4">
          <span className="text-lg font-bold tracking-tight text-white">Estudio UY — Acceso</span>
        </nav>
      </header>
    );
  }

  return (
    <header className="border-b border-blue-950/20 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 shadow-lg shadow-blue-950/20">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link className="text-lg font-bold tracking-tight text-white" href="/">
            Estudio UY
          </Link>
          <span className="hidden h-5 w-px bg-blue-400/40 sm:block" aria-hidden />
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <Link className={linkNav} href="/asuntos">
              Asuntos
            </Link>
            <Link className={linkNav} href="/asuntos/nuevo">
              Nuevo asunto
            </Link>
            <Link className={linkNav} href="/clientes" title="Directorio de clientes">
              Clientes
            </Link>
            <Link className={linkNav} href="/health">
              Health
            </Link>
            {me?.rol === "ADMIN" ? (
              <Link className={linkNav} href="/maestros">
                Socios y profesionales
              </Link>
            ) : null}
            {me?.rol === "ADMIN" ? (
              <Link className={linkNav} href="/admin/usuarios">
                Usuarios
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {me ? (
            <span className="hidden text-sm text-blue-100/90 sm:inline">
              {me.nombre} <span className="text-blue-300/80">({me.usuario})</span>
            </span>
          ) : me === undefined ? (
            <span className="text-sm text-blue-200/80">...</span>
          ) : null}
          <button
            className="rounded-lg border border-blue-400/50 bg-blue-950/30 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-950/50"
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
