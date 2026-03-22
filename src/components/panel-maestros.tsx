"use client";

import { useCallback, useEffect, useState } from "react";

type SocioRow = { id: string; nombre: string };
type ProfesionalRow = {
  id: string;
  nombre: string;
  profesion: string;
  funcion: string;
  rol: string;
};

const ROLES_SELECT: { value: string; label: string }[] = [
  { value: "SOCIO", label: "Socio" },
  { value: "ESCRIBANO", label: "Escribano" },
  { value: "ABOGADO", label: "Abogado" },
  { value: "PROCURADOR", label: "Procurador" },
];

type EliminarPendiente = {
  kind: "socio" | "profesional";
  id: string;
  etiqueta: string;
  paso: 1 | 2;
};

const btnSec =
  "rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-50";
const btnPeligro =
  "rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-100";

export function PanelMaestros() {
  const [socios, setSocios] = useState<SocioRow[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState("");

  const [nombreSocio, setNombreSocio] = useState("");
  const [msgSocio, setMsgSocio] = useState("");
  const [guardandoSocio, setGuardandoSocio] = useState(false);

  const [nombreProf, setNombreProf] = useState("");
  const [profesion, setProfesion] = useState("");
  const [funcion, setFuncion] = useState("");
  const [rolProf, setRolProf] = useState("ABOGADO");
  const [msgProf, setMsgProf] = useState("");
  const [guardandoProf, setGuardandoProf] = useState(false);

  const [eliminar, setEliminar] = useState<EliminarPendiente | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState("");

  const [editSocio, setEditSocio] = useState<SocioRow | null>(null);
  const [editSocioNombre, setEditSocioNombre] = useState("");
  const [guardandoEditSocio, setGuardandoEditSocio] = useState(false);
  const [msgEditSocio, setMsgEditSocio] = useState("");

  const [editProf, setEditProf] = useState<ProfesionalRow | null>(null);
  const [editProfNombre, setEditProfNombre] = useState("");
  const [editProfProfesion, setEditProfProfesion] = useState("");
  const [editProfFuncion, setEditProfFuncion] = useState("");
  const [editProfRol, setEditProfRol] = useState("ABOGADO");
  const [guardandoEditProf, setGuardandoEditProf] = useState(false);
  const [msgEditProf, setMsgEditProf] = useState("");

  const cargar = useCallback(async () => {
    setErrorLista("");
    setCargando(true);
    try {
      const [rS, rP] = await Promise.all([fetch("/api/socios"), fetch("/api/profesionales")]);
      if (!rS.ok) {
        const j = (await rS.json().catch(() => ({}))) as { error?: string };
        setErrorLista(j.error ?? "No se pudieron cargar los socios.");
        setSocios([]);
      } else {
        setSocios((await rS.json()) as SocioRow[]);
      }
      if (!rP.ok) {
        const j = (await rP.json().catch(() => ({}))) as { error?: string };
        setErrorLista((prev) => prev || (j.error ?? "No se pudieron cargar los profesionales."));
        setProfesionales([]);
      } else {
        setProfesionales((await rP.json()) as ProfesionalRow[]);
      }
    } catch {
      setErrorLista("Error de red al cargar el catalogo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function abrirEditarSocio(s: SocioRow) {
    setEditSocio(s);
    setEditSocioNombre(s.nombre);
    setMsgEditSocio("");
  }

  function abrirEditarProf(p: ProfesionalRow) {
    setEditProf(p);
    setEditProfNombre(p.nombre);
    setEditProfProfesion(p.profesion);
    setEditProfFuncion(p.funcion);
    setEditProfRol(p.rol);
    setMsgEditProf("");
  }

  async function guardarEditSocio(e: React.FormEvent) {
    e.preventDefault();
    if (!editSocio) {
      return;
    }
    const n = editSocioNombre.trim();
    if (!n) {
      setMsgEditSocio("El nombre es obligatorio.");
      return;
    }
    setGuardandoEditSocio(true);
    setMsgEditSocio("");
    try {
      const response = await fetch(`/api/socios/${editSocio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgEditSocio(data.error ?? "No se pudo guardar.");
        return;
      }
      setEditSocio(null);
      await cargar();
    } catch {
      setMsgEditSocio("Error de red.");
    } finally {
      setGuardandoEditSocio(false);
    }
  }

  async function guardarEditProf(e: React.FormEvent) {
    e.preventDefault();
    if (!editProf) {
      return;
    }
    const n = editProfNombre.trim();
    const pr = editProfProfesion.trim();
    const f = editProfFuncion.trim();
    if (!n || !pr || !f) {
      setMsgEditProf("Completa nombre, profesion y funcion.");
      return;
    }
    setGuardandoEditProf(true);
    setMsgEditProf("");
    try {
      const response = await fetch(`/api/profesionales/${editProf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          profesion: pr,
          funcion: f,
          rol: editProfRol,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgEditProf(data.error ?? "No se pudo guardar.");
        return;
      }
      setEditProf(null);
      await cargar();
    } catch {
      setMsgEditProf("Error de red.");
    } finally {
      setGuardandoEditProf(false);
    }
  }

  async function ejecutarEliminar() {
    if (!eliminar || eliminar.paso !== 2) {
      return;
    }
    setEliminando(true);
    setMsgEliminar("");
    const path =
      eliminar.kind === "socio"
        ? `/api/socios/${eliminar.id}`
        : `/api/profesionales/${eliminar.id}`;
    try {
      const response = await fetch(path, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgEliminar(data.error ?? "No se pudo eliminar.");
        return;
      }
      setEliminar(null);
      await cargar();
    } catch {
      setMsgEliminar("Error de red.");
    } finally {
      setEliminando(false);
    }
  }

  async function onSubmitSocio(e: React.FormEvent) {
    e.preventDefault();
    const n = nombreSocio.trim();
    if (!n) {
      setMsgSocio("El nombre es obligatorio.");
      return;
    }
    setGuardandoSocio(true);
    setMsgSocio("");
    try {
      const response = await fetch("/api/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgSocio(data.error ?? "No se pudo crear el socio.");
        return;
      }
      setNombreSocio("");
      setMsgSocio("Socio creado correctamente.");
      await cargar();
    } catch {
      setMsgSocio("Error de red.");
    } finally {
      setGuardandoSocio(false);
    }
  }

  async function onSubmitProf(e: React.FormEvent) {
    e.preventDefault();
    const n = nombreProf.trim();
    const p = profesion.trim();
    const f = funcion.trim();
    if (!n || !p || !f) {
      setMsgProf("Completa nombre, profesion y funcion.");
      return;
    }
    setGuardandoProf(true);
    setMsgProf("");
    try {
      const response = await fetch("/api/profesionales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          profesion: p,
          funcion: f,
          rol: rolProf,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgProf(data.error ?? "No se pudo crear el profesional.");
        return;
      }
      setNombreProf("");
      setProfesion("");
      setFuncion("");
      setRolProf("ABOGADO");
      setMsgProf("Profesional creado correctamente.");
      await cargar();
    } catch {
      setMsgProf("Error de red.");
    } finally {
      setGuardandoProf(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {errorLista ? (
        <p className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {errorLista}
        </p>
      ) : null}

      {/* Modal doble confirmación eliminar */}
      {eliminar ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!eliminando) {
              setEliminar(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-titulo"
            className="max-w-md rounded-xl border border-blue-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 id="eliminar-titulo" className="text-lg font-semibold text-blue-950">
              {eliminar.paso === 1 ? "Confirmar eliminacion" : "Ultima confirmacion"}
            </h2>
            {eliminar.paso === 1 ? (
              <p className="mt-3 text-sm text-blue-900/90">
                ¿Está seguro que desea eliminar{" "}
                <span className="font-semibold text-blue-950">{eliminar.etiqueta}</span>?
              </p>
            ) : (
              <p className="mt-3 text-sm text-blue-900/90">
                Segunda confirmación: se eliminará de forma permanente{" "}
                <span className="font-semibold text-blue-950">{eliminar.etiqueta}</span>. Esta acción
                no se puede deshacer.
              </p>
            )}
            {msgEliminar ? <p className="mt-2 text-sm text-red-700">{msgEliminar}</p> : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={btnSec}
                disabled={eliminando}
                onClick={() => {
                  if (eliminando) {
                    return;
                  }
                  setMsgEliminar("");
                  setEliminar(null);
                }}
              >
                Cancelar
              </button>
              {eliminar.paso === 1 ? (
                <button
                  type="button"
                  className={btnPeligro}
                  disabled={eliminando}
                  onClick={() => {
                    setMsgEliminar("");
                    setEliminar({ ...eliminar, paso: 2 });
                  }}
                >
                  Sí, deseo eliminar
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
                  disabled={eliminando}
                  onClick={() => void ejecutarEliminar()}
                >
                  {eliminando ? "Eliminando…" : "Eliminar definitivamente"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal editar socio */}
      {editSocio ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!guardandoEditSocio) {
              setEditSocio(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-socio-titulo"
            className="w-full max-w-md rounded-xl border border-blue-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 id="edit-socio-titulo" className="text-lg font-semibold text-blue-950">
              Editar socio
            </h2>
            <form className="mt-4 space-y-3" onSubmit={(e) => void guardarEditSocio(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="edit-socio-nombre">
                  Nombre
                </label>
                <input
                  id="edit-socio-nombre"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
                  value={editSocioNombre}
                  onChange={(e) => setEditSocioNombre(e.target.value)}
                />
              </div>
              {msgEditSocio ? <p className="text-sm text-red-700">{msgEditSocio}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={btnSec}
                  disabled={guardandoEditSocio}
                  onClick={() => setEditSocio(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditSocio}
                  className="rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-950 disabled:opacity-60"
                >
                  {guardandoEditSocio ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal editar profesional */}
      {editProf ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!guardandoEditProf) {
              setEditProf(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-prof-titulo"
            className="w-full max-w-md rounded-xl border border-blue-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 id="edit-prof-titulo" className="text-lg font-semibold text-blue-950">
              Editar profesional
            </h2>
            <form className="mt-4 space-y-3" onSubmit={(e) => void guardarEditProf(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="edit-prof-nombre">
                  Nombre
                </label>
                <input
                  id="edit-prof-nombre"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
                  value={editProfNombre}
                  onChange={(e) => setEditProfNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="edit-prof-profesion">
                  Profesion
                </label>
                <input
                  id="edit-prof-profesion"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
                  value={editProfProfesion}
                  onChange={(e) => setEditProfProfesion(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="edit-prof-funcion">
                  Funcion
                </label>
                <input
                  id="edit-prof-funcion"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
                  value={editProfFuncion}
                  onChange={(e) => setEditProfFuncion(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="edit-prof-rol">
                  Rol operativo
                </label>
                <select
                  id="edit-prof-rol"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
                  value={editProfRol}
                  onChange={(e) => setEditProfRol(e.target.value)}
                >
                  {ROLES_SELECT.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {msgEditProf ? <p className="text-sm text-red-700">{msgEditProf}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={btnSec}
                  disabled={guardandoEditProf}
                  onClick={() => setEditProf(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEditProf}
                  className="rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-950 disabled:opacity-60"
                >
                  {guardandoEditProf ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-blue-200/80 bg-white p-5 shadow-sm shadow-blue-950/5">
        <h2 className="text-lg font-semibold text-blue-950">Nuevo socio</h2>
        <form className="space-y-3" onSubmit={(e) => void onSubmitSocio(e)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="maestro-socio-nombre">
              Nombre
            </label>
            <input
              id="maestro-socio-nombre"
              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
              value={nombreSocio}
              onChange={(e) => setNombreSocio(e.target.value)}
              placeholder="Nombre del socio"
              autoComplete="name"
            />
          </div>
          {msgSocio ? (
            <p
              className={
                msgSocio.includes("correctamente")
                  ? "text-sm text-emerald-700"
                  : "text-sm text-red-700"
              }
            >
              {msgSocio}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={guardandoSocio}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:opacity-60"
          >
            {guardandoSocio ? "Guardando…" : "Dar de alta socio"}
          </button>
        </form>

        <div className="border-t border-blue-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-900">Socios ({cargando ? "…" : socios.length})</h3>
          {cargando ? (
            <p className="text-sm text-blue-800/70">Cargando…</p>
          ) : socios.length === 0 ? (
            <p className="text-sm text-blue-800/70">No hay socios cargados.</p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto text-sm text-blue-950">
              {socios.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-blue-100/80 bg-blue-50/40 px-2 py-2"
                >
                  <span className="min-w-0 flex-1">{s.nombre}</span>
                  <span className="flex shrink-0 gap-1.5">
                    <button type="button" className={btnSec} onClick={() => abrirEditarSocio(s)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={btnPeligro}
                      onClick={() => {
                        setMsgEliminar("");
                        setEliminar({
                          kind: "socio",
                          id: s.id,
                          etiqueta: s.nombre,
                          paso: 1,
                        });
                      }}
                    >
                      Eliminar
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-blue-200/80 bg-white p-5 shadow-sm shadow-blue-950/5">
        <h2 className="text-lg font-semibold text-blue-950">Nuevo profesional</h2>
        <form className="space-y-3" onSubmit={(e) => void onSubmitProf(e)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="maestro-prof-nombre">
              Nombre
            </label>
            <input
              id="maestro-prof-nombre"
              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
              value={nombreProf}
              onChange={(e) => setNombreProf(e.target.value)}
              placeholder="Nombre completo"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="maestro-profesion">
              Profesion
            </label>
            <input
              id="maestro-profesion"
              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
              value={profesion}
              onChange={(e) => setProfesion(e.target.value)}
              placeholder="Ej. Abogado, Escribano"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="maestro-funcion">
              Funcion en el estudio
            </label>
            <input
              id="maestro-funcion"
              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
              value={funcion}
              onChange={(e) => setFuncion(e.target.value)}
              placeholder="Ej. Socio, Asociado, Colaborador externo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="maestro-rol">
              Rol operativo
            </label>
            <select
              id="maestro-rol"
              className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2"
              value={rolProf}
              onChange={(e) => setRolProf(e.target.value)}
            >
              {ROLES_SELECT.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {msgProf ? (
            <p
              className={
                msgProf.includes("correctamente")
                  ? "text-sm text-emerald-700"
                  : "text-sm text-red-700"
              }
            >
              {msgProf}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={guardandoProf}
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:opacity-60"
          >
            {guardandoProf ? "Guardando…" : "Dar de alta profesional"}
          </button>
        </form>

        <div className="border-t border-blue-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-900">
            Profesionales ({cargando ? "…" : profesionales.length})
          </h3>
          {cargando ? (
            <p className="text-sm text-blue-800/70">Cargando…</p>
          ) : profesionales.length === 0 ? (
            <p className="text-sm text-blue-800/70">No hay profesionales cargados.</p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto text-sm text-blue-950">
              {profesionales.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-blue-100/80 bg-blue-50/40 px-2 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-blue-800/80">
                      {" "}
                      — {p.profesion} · {p.funcion} · {p.rol}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <button type="button" className={btnSec} onClick={() => abrirEditarProf(p)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={btnPeligro}
                      onClick={() => {
                        setMsgEliminar("");
                        setEliminar({
                          kind: "profesional",
                          id: p.id,
                          etiqueta: p.nombre,
                          paso: 1,
                        });
                      }}
                    >
                      Eliminar
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
