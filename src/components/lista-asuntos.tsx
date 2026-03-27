"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type AsuntoRow = {
  id: string;
  ordinal: number;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaAlertaVencimiento: string | null;
  fechaFinalizacion: string | null;
  descripcion: string | null;
  ultimoMovimientoTexto: string | null;
  cliente: { id: string; nombre: string; documento: string };
  catalogo: { nombre: string };
  socioReferente: { nombre: string };
  profesionalACargo: { nombre: string };
};

type ProfesionalFiltro = {
  id: string;
  nombre: string;
};

type SocioFiltro = {
  id: string;
  nombre: string;
};

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

const filtroBox =
  "rounded-xl border border-blue-200/70 bg-gradient-to-br from-white to-blue-50/40 p-3 shadow-sm shadow-blue-950/5 sm:p-4";

const labelFiltro = "mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-800/85";

function etiquetaTipo(tipo: string): string {
  switch (tipo) {
    case "TODOS":
      return "Todos";
    case "NOTARIAL":
      return "Notarial";
    case "LEGAL":
      return "Legal";
    default:
      return tipo;
  }
}

function fmtFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function ListaAsuntos() {
  const [estado, setEstado] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [profesionalACargoId, setProfesionalACargoId] = useState<string>("");
  const [socioReferenteId, setSocioReferenteId] = useState<string>("");
  const [anioInicio, setAnioInicio] = useState<string>("");
  const [fechaInicioDesde, setFechaInicioDesde] = useState<string>("");
  const [fechaInicioHasta, setFechaInicioHasta] = useState<string>("");
  const [fechaFinalizacionDesde, setFechaFinalizacionDesde] = useState<string>("");
  const [fechaFinalizacionHasta, setFechaFinalizacionHasta] = useState<string>("");
  const [profesionales, setProfesionales] = useState<ProfesionalFiltro[]>([]);
  const [socios, setSocios] = useState<SocioFiltro[]>([]);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lista, setLista] = useState<AsuntoRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [rol, setRol] = useState<RolMe | null>(null);

  const hayFiltrosActivos = useMemo(
    () =>
      Boolean(
        estado ||
          tipo ||
          profesionalACargoId ||
          socioReferenteId ||
          anioInicio ||
          fechaInicioDesde ||
          fechaInicioHasta ||
          fechaFinalizacionDesde ||
          fechaFinalizacionHasta ||
          debounced,
      ),
    [
      estado,
      tipo,
      profesionalACargoId,
      socioReferenteId,
      anioInicio,
      fechaInicioDesde,
      fechaInicioHasta,
      fechaFinalizacionDesde,
      fechaFinalizacionHasta,
      debounced,
    ],
  );

  function limpiarFiltros() {
    setEstado("");
    setTipo("");
    setProfesionalACargoId("");
    setSocioReferenteId("");
    setAnioInicio("");
    setFechaInicioDesde("");
    setFechaInicioHasta("");
    setFechaFinalizacionDesde("");
    setFechaFinalizacionHasta("");
    setQ("");
  }

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRol(d.rol as RolMe))
      .catch(() => setRol(null));
  }, []);

  useEffect(() => {
    void fetch("/api/catalogos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = (d?.profesionales ?? []) as { id?: string; nombre?: string; grupo?: string }[];
        const s = (d?.socios ?? []) as { id?: string; nombre?: string }[];
        setProfesionales(
          p
            .filter(
              (x) =>
                typeof x.id === "string" &&
                typeof x.nombre === "string" &&
                x.grupo === "LEGAL_A_CARGO",
            )
            .map((x) => ({ id: x.id as string, nombre: x.nombre as string })),
        );
        setSocios(
          s
            .filter((x) => typeof x.id === "string" && typeof x.nombre === "string")
            .map((x) => ({ id: x.id as string, nombre: x.nombre as string })),
        );
      })
      .catch(() => {
        setProfesionales([]);
        setSocios([]);
      });
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);
      if (tipo) params.set("tipo", tipo);
      if (profesionalACargoId) params.set("profesionalACargoId", profesionalACargoId);
      if (socioReferenteId) params.set("socioReferenteId", socioReferenteId);
      if (anioInicio) params.set("anioInicio", anioInicio);
      if (fechaInicioDesde) params.set("fechaInicioDesde", fechaInicioDesde);
      if (fechaInicioHasta) params.set("fechaInicioHasta", fechaInicioHasta);
      if (fechaFinalizacionDesde) params.set("fechaFinalizacionDesde", fechaFinalizacionDesde);
      if (fechaFinalizacionHasta) params.set("fechaFinalizacionHasta", fechaFinalizacionHasta);
      if (debounced) params.set("q", debounced);
      const qs = params.toString();
      const response = await fetch(qs ? `/api/asuntos?${qs}` : "/api/asuntos");
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cargar asuntos.");
        return;
      }
      setLista(data as AsuntoRow[]);
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setCargando(false);
    }
  }, [
    debounced,
    estado,
    tipo,
    profesionalACargoId,
    socioReferenteId,
    anioInicio,
    fechaInicioDesde,
    fechaInicioHasta,
    fechaFinalizacionDesde,
    fechaFinalizacionHasta,
  ]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar]);

  return (
    <div className="card-app space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-blue-950">Listado</h2>
          <p className="text-sm text-blue-800/75">
            Filtrá por estado, tipo, equipo o fechas. Tu rol:{" "}
            <span className="font-medium text-blue-900">{rol ?? "…"}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!cargando ? (
            <span className="rounded-full bg-blue-100/80 px-3 py-1 text-xs font-medium text-blue-900">
              {lista.length} {lista.length === 1 ? "asunto" : "asuntos"}
            </span>
          ) : null}
          {hayFiltrosActivos ? (
            <button
              type="button"
              className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm transition-colors hover:bg-blue-50"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={filtroBox}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700/90">
            Búsqueda y tipo
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelFiltro}>Buscar</span>
              <input
                className="input-app py-2 text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cliente, documento, asunto, texto…"
              />
            </label>
            <label>
              <span className={labelFiltro}>Estado</span>
              <select className="input-app py-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option value="EN_TRAMITE">En trámite</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </label>
            <label>
              <span className={labelFiltro}>Tipo</span>
              <select className="input-app py-2 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="TODOS">Todos (catálogo)</option>
                <option value="NOTARIAL">Notarial</option>
                <option value="LEGAL">Legal</option>
              </select>
            </label>
          </div>
        </div>

        <div className={filtroBox}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700/90">Equipo</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelFiltro}>Equipo a cargo</span>
              <select
                className="input-app py-2 text-sm"
                value={profesionalACargoId}
                onChange={(e) => setProfesionalACargoId(e.target.value)}
              >
                <option value="">Todos</option>
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelFiltro}>Socio referente</span>
              <select
                className="input-app py-2 text-sm"
                value={socioReferenteId}
                onChange={(e) => setSocioReferenteId(e.target.value)}
              >
                <option value="">Todos</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={`${filtroBox} lg:col-span-2`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-700/90">Fechas</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label>
              <span className={labelFiltro}>Año inicio</span>
              <input
                className="input-app py-2 text-sm"
                value={anioInicio}
                onChange={(e) => setAnioInicio(e.target.value)}
                placeholder="Ej. 2026"
                inputMode="numeric"
              />
            </label>
            <label>
              <span className={labelFiltro}>Inicio desde</span>
              <input
                className="input-app py-2 text-sm"
                type="date"
                value={fechaInicioDesde}
                onChange={(e) => setFechaInicioDesde(e.target.value)}
              />
            </label>
            <label>
              <span className={labelFiltro}>Inicio hasta</span>
              <input
                className="input-app py-2 text-sm"
                type="date"
                value={fechaInicioHasta}
                onChange={(e) => setFechaInicioHasta(e.target.value)}
              />
            </label>
            <label>
              <span className={labelFiltro}>Finalización desde</span>
              <input
                className="input-app py-2 text-sm"
                type="date"
                value={fechaFinalizacionDesde}
                onChange={(e) => setFechaFinalizacionDesde(e.target.value)}
              />
            </label>
            <label className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
              <span className={labelFiltro}>Finalización hasta</span>
              <input
                className="input-app py-2 text-sm"
                type="date"
                value={fechaFinalizacionHasta}
                onChange={(e) => setFechaFinalizacionHasta(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {mensaje ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{mensaje}</p>
      ) : null}

      {cargando ? (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white/80 px-4 py-6 text-sm text-blue-800/80">
          <span
            className="inline-block size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"
            aria-hidden
          />
          Cargando asuntos…
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 px-6 py-10 text-center">
          <p className="text-base font-medium text-blue-950">No hay asuntos con estos filtros</p>
          <p className="mt-2 text-sm text-blue-800/75">
            {hayFiltrosActivos
              ? "Probá limpiar filtros o ajustar la búsqueda."
              : "Creá uno desde el botón Crear asunto en la parte superior de esta página."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {hayFiltrosActivos ? (
              <button
                type="button"
                className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-blue-200/80 bg-white shadow-sm shadow-blue-950/5 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-blue-200 bg-blue-950/[0.04] text-blue-900">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Asunto</th>
                    <th className="px-4 py-3 font-semibold">Equipo</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-blue-100/90 transition-colors hover:bg-blue-50/60 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-sm text-blue-900">{a.ordinal}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            a.estado === "FINALIZADO"
                              ? "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                              : "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                          }
                        >
                          {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-blue-900">{etiquetaTipo(a.tipo)}</td>
                      <td className="max-w-[200px] px-4 py-3">
                        <span className="font-medium text-blue-950">{a.cliente.nombre}</span>
                        <span className="mt-0.5 block truncate text-xs text-blue-700/80">{a.cliente.documento}</span>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-blue-900" title={a.catalogo.nombre}>
                        {a.catalogo.nombre}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-blue-800" title={a.profesionalACargo.nombre}>
                        {a.profesionalACargo.nombre}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-blue-800/90">{fmtFechaCorta(a.fechaInicio)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          className="inline-flex rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                          href={`/asuntos/${a.id}`}
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {lista.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-blue-200/80 bg-white p-4 shadow-sm shadow-blue-950/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-blue-700">#{a.ordinal}</p>
                    <p className="mt-1 font-semibold text-blue-950">{a.catalogo.nombre}</p>
                    <p className="mt-1 text-sm text-blue-900">{a.cliente.nombre}</p>
                    <p className="text-xs text-blue-700/80">{a.cliente.documento}</p>
                  </div>
                  <span
                    className={
                      a.estado === "FINALIZADO"
                        ? "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                        : "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                    }
                  >
                    {a.estado === "EN_TRAMITE" ? "En trámite" : "Finalizado"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-blue-100 pt-3 text-xs text-blue-800/90">
                  <span>
                    <span className="text-blue-600/80">Tipo:</span> {etiquetaTipo(a.tipo)}
                  </span>
                  <span>
                    <span className="text-blue-600/80">Equipo:</span> {a.profesionalACargo.nombre}
                  </span>
                  <span>
                    <span className="text-blue-600/80">Inicio:</span> {fmtFechaCorta(a.fechaInicio)}
                  </span>
                </div>
                <Link
                  className="btn-primary mt-4 block w-full text-center text-sm"
                  href={`/asuntos/${a.id}`}
                >
                  Ver ficha
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
