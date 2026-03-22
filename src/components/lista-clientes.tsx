"use client";

import { useCallback, useEffect, useState } from "react";

type ClienteRow = {
  id: string;
  nombre: string;
  documento: string;
  tipoPersona: string;
  telefono: string | null;
  email: string | null;
  contacto: string | null;
};

export function ListaClientes({ refreshKey = 0 }: { refreshKey?: number }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lista, setLista] = useState<ClienteRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const url = debounced ? `/api/clientes?q=${encodeURIComponent(debounced)}` : "/api/clientes";
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cargar clientes.");
        return;
      }
      setLista(data as ClienteRow[]);
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setCargando(false);
    }
  }, [debounced]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar, refreshKey]);

  async function eliminar(id: string, nombre: string) {
    if (!window.confirm(`Eliminar cliente "${nombre}"? Solo si no tiene asuntos asociados.`)) {
      return;
    }
    setMensaje("");
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo eliminar.");
        return;
      }
      await cargar();
    } catch {
      setMensaje("Error de conexion.");
    }
  }

  return (
    <div className="card-app space-y-4">
      <div className="flex flex-col gap-2 border-b border-blue-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-blue-950">Registro de personas</h2>
          <p className="text-sm text-blue-800/70">Búsqueda por nombre, documento o datos de contacto.</p>
        </div>
        <label className="min-w-[200px] flex-1 space-y-1 sm:max-w-xs">
          <span className="text-xs font-medium text-blue-900/80">Buscar</span>
          <input className="input-app" value={q} onChange={(e) => setQ(e.target.value)} placeholder="..." />
        </label>
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-blue-200 text-blue-900/80">
                <th className="pb-2 pr-2 font-medium">Nombre</th>
                <th className="pb-2 pr-2 font-medium">Doc.</th>
                <th className="pb-2 pr-2 font-medium">Tipo</th>
                <th className="pb-2 pr-2 font-medium">Contacto</th>
                <th className="pb-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-b border-blue-100/80">
                  <td className="py-2 pr-2 font-medium text-blue-950">{c.nombre}</td>
                  <td className="py-2 pr-2 text-blue-900">{c.documento}</td>
                  <td className="py-2 pr-2 text-blue-800">{c.tipoPersona}</td>
                  <td className="py-2 pr-2 text-blue-900">
                    {[c.telefono, c.email, c.contacto].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs text-red-800"
                      onClick={() => void eliminar(c.id, c.nombre)}
                    >
                      Eliminar
                    </button>
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
