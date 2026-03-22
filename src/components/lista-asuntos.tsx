"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

export function ListaAsuntos() {
  const [estado, setEstado] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lista, setLista] = useState<AsuntoRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [rol, setRol] = useState<RolMe | null>(null);

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

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);
      if (tipo) params.set("tipo", tipo);
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
  }, [debounced, estado, tipo]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar]);

  return (
    <div className="card-app space-y-4">
      <div className="flex flex-col gap-4 border-b border-blue-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-blue-950">Asuntos</h2>
          <p className="text-sm text-blue-800/70">
            Filtros basicos (RF-07). Tu rol:{" "}
            <span className="font-medium text-blue-950">{rol ?? "..."}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-blue-900/80">Estado</span>
            <select className="input-app py-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="EN_TRAMITE">En tramite</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-blue-900/80">Tipo</span>
            <select className="input-app py-2 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="TODOS">TODOS</option>
              <option value="NOTARIAL">NOTARIAL</option>
              <option value="LEGAL">LEGAL</option>
            </select>
          </label>
          <label className="min-w-[180px] flex-1 space-y-1">
            <span className="text-xs font-medium text-blue-900/80">Buscar</span>
            <input
              className="input-app py-2 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cliente, texto, catalogo..."
            />
          </label>
        </div>
      </div>

      {mensaje ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{mensaje}</p>
      ) : null}

      {cargando ? (
        <p className="text-sm text-blue-800/70">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-blue-800/70">Sin resultados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-blue-200 text-blue-900/80">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-2 font-medium">Estado</th>
                <th className="pb-2 pr-2 font-medium">Tipo</th>
                <th className="pb-2 pr-2 font-medium">Cliente</th>
                <th className="pb-2 pr-2 font-medium">Asunto</th>
                <th className="pb-2 pr-2 font-medium">Profesional</th>
                <th className="pb-2 font-medium">Ver</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id} className="border-b border-blue-100/80">
                  <td className="py-2 pr-2 font-mono text-blue-900">{a.ordinal}</td>
                  <td className="py-2 pr-2">
                    <span
                      className={
                        a.estado === "FINALIZADO"
                          ? "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                          : "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
                      }
                    >
                      {a.estado === "EN_TRAMITE" ? "En tramite" : "Finalizado"}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-blue-900">{a.tipo}</td>
                  <td className="py-2 pr-2 text-blue-950">{a.cliente.nombre}</td>
                  <td className="py-2 pr-2 text-blue-900">{a.catalogo.nombre}</td>
                  <td className="py-2 pr-2 text-blue-800">{a.profesionalACargo.nombre}</td>
                  <td className="py-2">
                    <Link className="text-sm font-medium text-blue-700 underline" href={`/asuntos/${a.id}`}>
                      Ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
