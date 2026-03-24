"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

type AsuntoFicha = {
  id: string;
  ordinal: number;
  tipo: string;
  estado: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFinalizacion: string | null;
  fechaAlertaVencimiento: string | null;
  ultimoMovimientoFecha: string | null;
  ultimoMovimientoTexto: string | null;
  cliente: { id: string; nombre: string; documento: string; telefono?: string | null; email?: string | null };
  catalogo: { nombre: string };
  socioReferente: { nombre: string };
  profesionalACargo: { id: string; nombre: string; rol: string };
  colaboradorACargo: { id: string; nombre: string } | null;
  contadorReferente: { id: string; nombre: string } | null;
  seguimientos: {
    id: string;
    fecha: string;
    descripcion: string;
    usuarioId: string | null;
  }[];
};

function puedeFinalizar(rol: RolMe | null): boolean {
  return rol === "ADMIN" || rol === "SOCIO";
}

function puedeReabrir(rol: RolMe | null): boolean {
  return rol === "ADMIN";
}

function puedeMovimiento(rol: RolMe | null): boolean {
  if (!rol || rol === "SOLO_LECTURA" || rol === "CONTADOR") return false;
  return (
    rol === "ADMIN" ||
    rol === "SOCIO" ||
    rol === "PROFESIONAL" ||
    rol === "COLABORADOR" ||
    rol === "USUARIO"
  );
}

function fmtFecha(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-UY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return s;
  }
}

/** Valor inicial para inputs type="date" (zona local). */
function hoyIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FichaAsunto({ id }: { id: string }) {
  const router = useRouter();
  const [asunto, setAsunto] = useState<AsuntoFicha | null>(null);
  const [rol, setRol] = useState<RolMe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [movTexto, setMovTexto] = useState("");
  const [movFecha, setMovFecha] = useState(() => hoyIsoDate());
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [fechaFin, setFechaFin] = useState(() => hoyIsoDate());
  const [accionando, setAccionando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [rAsunto, rMe] = await Promise.all([
        fetch(`/api/asuntos/${id}`),
        fetch("/api/auth/me"),
      ]);
      const dataA = await rAsunto.json();
      if (!rAsunto.ok) {
        setMensaje(dataA?.error ?? "No se pudo cargar el asunto.");
        setAsunto(null);
        return;
      }
      setAsunto(dataA as AsuntoFicha);

      if (rMe.ok) {
        const me = await rMe.json();
        setRol(me.rol as RolMe);
      }
    } catch {
      setMensaje("Error de conexion.");
      setAsunto(null);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar]);

  /** Al abrir otra ficha, las fechas editables vuelven a hoy. */
  useEffect(() => {
    const hoy = hoyIsoDate();
    setMovFecha(hoy);
    setFechaFin(hoy);
  }, [id]);

  async function registrarMovimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!movTexto.trim()) {
      setMensaje("Escribi la descripcion del movimiento.");
      return;
    }
    setGuardandoMov(true);
    setMensaje("");
    try {
      const body: { descripcion: string; fecha?: string } = { descripcion: movTexto.trim() };
      if (movFecha) body.fecha = movFecha;
      const response = await fetch(`/api/asuntos/${id}/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo registrar el movimiento.");
        return;
      }
      setMovTexto("");
      setMovFecha(hoyIsoDate());
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setGuardandoMov(false);
    }
  }

  async function finalizar() {
    if (!fechaFin) {
      setMensaje("Indica la fecha de finalizacion.");
      return;
    }
    setAccionando(true);
    setMensaje("");
    try {
      const response = await fetch(`/api/asuntos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "finalizar",
          fechaFinalizacion: fechaFin,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo finalizar.");
        return;
      }
      setFechaFin(hoyIsoDate());
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setAccionando(false);
    }
  }

  async function reabrir() {
    if (!window.confirm("Reabrir este asunto? Quedara EN TRAMITE.")) return;
    setAccionando(true);
    setMensaje("");
    try {
      const response = await fetch(`/api/asuntos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "reabrir" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo reabrir.");
        return;
      }
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setAccionando(false);
    }
  }

  if (cargando) {
    return <p className="text-sm text-blue-800/70">Cargando ficha...</p>;
  }

  if (!asunto) {
    return (
      <div className="card-app">
        <p className="text-sm text-red-800">{mensaje || "Asunto no encontrado."}</p>
        <Link href="/asuntos" className="mt-4 inline-block text-sm font-medium text-blue-700 underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  const enTramite = asunto.estado === "EN_TRAMITE";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-blue-800/70">
            <Link href="/asuntos" className="font-medium text-blue-700 underline">
              Asuntos
            </Link>{" "}
            / Ordinal {asunto.ordinal}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-blue-950 md:text-3xl">{asunto.catalogo.nombre}</h1>
          <p className="mt-1 text-sm text-blue-900">
            {asunto.cliente.nombre} · {asunto.cliente.documento}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={
              enTramite
                ? "rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800"
                : "rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
            }
          >
            {enTramite ? "EN TRAMITE" : "FINALIZADO"}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900">
            {asunto.tipo}
          </span>
        </div>
      </div>

      {mensaje ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{mensaje}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-app space-y-2 text-sm">
          <h2 className="text-base font-semibold text-blue-950">Datos</h2>
          <p>
            <span className="text-blue-800/80">Inicio:</span> {fmtFecha(asunto.fechaInicio)}
          </p>
          <p>
            <span className="text-blue-800/80">Alerta venc.:</span> {fmtFecha(asunto.fechaAlertaVencimiento)}
          </p>
          <p>
            <span className="text-blue-800/80">Finalizacion:</span> {fmtFecha(asunto.fechaFinalizacion)}
          </p>
          <p>
            <span className="text-blue-800/80">Ultimo movimiento:</span> {fmtFecha(asunto.ultimoMovimientoFecha)}
          </p>
          {asunto.ultimoMovimientoTexto ? (
            <p className="rounded border border-blue-100 bg-blue-50/50 p-2 text-blue-950">
              {asunto.ultimoMovimientoTexto}
            </p>
          ) : null}
          {asunto.descripcion ? (
            <p>
              <span className="text-blue-800/80">Descripcion:</span> {asunto.descripcion}
            </p>
          ) : null}
        </div>

        <div className="card-app space-y-2 text-sm">
          <h2 className="text-base font-semibold text-blue-950">Equipo</h2>
          <p>
            <span className="text-blue-800/80">Socio referente:</span> {asunto.socioReferente.nombre}
          </p>
          <p>
            <span className="text-blue-800/80">Profesional a cargo:</span> {asunto.profesionalACargo.nombre} (
            {asunto.profesionalACargo.rol})
          </p>
          {asunto.colaboradorACargo ? (
            <p>
              <span className="text-blue-800/80">Colaborador:</span> {asunto.colaboradorACargo.nombre}
            </p>
          ) : null}
          {asunto.contadorReferente ? (
            <p>
              <span className="text-blue-800/80">Contador:</span> {asunto.contadorReferente.nombre}
            </p>
          ) : null}
        </div>
      </div>

      {enTramite && puedeMovimiento(rol) ? (
        <form className="card-app space-y-3" onSubmit={registrarMovimiento}>
          <h2 className="text-base font-semibold text-blue-950">Nuevo movimiento</h2>
          <textarea
            className="input-app min-h-24 resize-y"
            placeholder="Descripcion del movimiento"
            value={movTexto}
            onChange={(e) => setMovTexto(e.target.value)}
          />
          <label className="block space-y-1">
            <span className="text-sm font-medium text-blue-950">Fecha (por defecto hoy; podés cambiarla)</span>
            <input className="input-app max-w-xs" type="date" value={movFecha} onChange={(e) => setMovFecha(e.target.value)} />
          </label>
          <button className="btn-primary" type="submit" disabled={guardandoMov}>
            {guardandoMov ? "Guardando..." : "Registrar movimiento"}
          </button>
        </form>
      ) : enTramite && !puedeMovimiento(rol) ? (
        <p className="text-sm text-blue-800/70">Tu rol no permite registrar movimientos en este asunto.</p>
      ) : null}

      {enTramite && puedeFinalizar(rol) ? (
        <div className="card-app flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="space-y-1">
            <span className="text-sm font-medium text-blue-950">Finalizar — fecha</span>
            <input className="input-app" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn-secondary"
            disabled={accionando}
            onClick={() => void finalizar()}
          >
            {accionando ? "..." : "Finalizar asunto"}
          </button>
        </div>
      ) : null}

      {!enTramite && puedeReabrir(rol) ? (
        <div className="card-app">
          <button type="button" className="btn-secondary" disabled={accionando} onClick={() => void reabrir()}>
            {accionando ? "..." : "Reabrir asunto (solo admin)"}
          </button>
        </div>
      ) : null}

      <div className="card-app">
        <h2 className="mb-3 text-base font-semibold text-blue-950">Historial de movimientos</h2>
        <ul className="space-y-3">
          {asunto.seguimientos.map((s) => (
            <li key={s.id} className="rounded-lg border border-blue-100 bg-white/80 p-3 text-sm">
              <p className="text-xs text-blue-700">{fmtFecha(s.fecha)}</p>
              <p className="mt-1 whitespace-pre-wrap text-blue-950">{s.descripcion}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
