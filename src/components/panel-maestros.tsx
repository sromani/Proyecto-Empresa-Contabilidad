"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type GrupoCatalogo,
  type PuestoCatalogo,
  ETIQUETA_GRUPO,
  ETIQUETA_PUESTO,
  PUESTOS_EQUIPO_ORDEN,
  grupoDesdePuesto,
  puestoRequiereFuncionEnEstudio,
} from "@/lib/profesional-equipo-catalogo";

type SocioRow = { id: string; nombre: string; profesion: string; funcion: string };
type ProfesionalRow = {
  id: string;
  nombre: string;
  profesion: string;
  funcion: string;
  grupo: GrupoCatalogo;
  puesto: PuestoCatalogo;
};

type EliminarPendiente = {
  kind: "socio" | "profesional";
  id: string;
  etiqueta: string;
  paso: 1 | 2;
};

type FilaLista = {
  key: string;
  tipo: "socio" | "equipo";
  id: string;
  nombre: string;
  rolEtiqueta: string;
  areaEtiqueta: string;
  profesion: string;
  funcion: string;
};

type CampoReasignacionMasiva =
  | "profesionalACargoId"
  | "colaboradorACargoId"
  | "colaboradorACargo2Id"
  | "contadorReferenteId"
  | "socioReferenteId";

const LABEL_CAMPO_REA: Record<CampoReasignacionMasiva, string> = {
  profesionalACargoId: "Equipo a cargo (escribano / abogado)",
  colaboradorACargoId: "Colaborador 1",
  colaboradorACargo2Id: "Colaborador 2",
  contadorReferenteId: "Contador referente",
  socioReferenteId: "Socio referente",
};

const ORDEN_CAMPO_REA_PROF: CampoReasignacionMasiva[] = [
  "profesionalACargoId",
  "colaboradorACargoId",
  "colaboradorACargo2Id",
  "contadorReferenteId",
];

/** Subcadena en nombre, sin distinguir mayúsculas ni tildes. */
function nombreCoincideBusqueda(nombre: string, consulta: string): boolean {
  const q = consulta.trim();
  if (!q) return true;
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase();
  return norm(nombre).includes(norm(q));
}

const btnSec =
  "rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-900 transition-colors hover:bg-blue-50";
const btnPeligro =
  "rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-100";

const inputClass =
  "w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-950 outline-none ring-blue-400/30 focus:ring-2";

export function PanelMaestros() {
  const [socios, setSocios] = useState<SocioRow[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState("");

  const [socNombre, setSocNombre] = useState("");
  const [socProfesion, setSocProfesion] = useState("");
  const [socFuncion, setSocFuncion] = useState("");
  const [msgSoc, setMsgSoc] = useState("");
  const [guardSoc, setGuardSoc] = useState(false);

  const [eqNombre, setEqNombre] = useState("");
  const [eqRol, setEqRol] = useState<PuestoCatalogo>("ESCRIBANO");
  const [eqProfesion, setEqProfesion] = useState("");
  const [eqFuncion, setEqFuncion] = useState("");
  const [msgEq, setMsgEq] = useState("");
  const [guardEq, setGuardEq] = useState(false);

  const [eliminar, setEliminar] = useState<EliminarPendiente | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [msgEliminar, setMsgEliminar] = useState("");
  const [pendientesMiembro, setPendientesMiembro] = useState<{
    total: number;
    porRol: Partial<Record<CampoReasignacionMasiva, number>>;
  } | null>(null);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);

  const reasignacionMasivaRef = useRef<HTMLDivElement>(null);
  const omitirResetReaDesdeRef = useRef(false);

  const [editSocio, setEditSocio] = useState<SocioRow | null>(null);
  const [editSocNombre, setEditSocNombre] = useState("");
  const [editSocProfesion, setEditSocProfesion] = useState("");
  const [editSocFuncion, setEditSocFuncion] = useState("");
  const [guardEditSocio, setGuardEditSocio] = useState(false);
  const [msgEditSocio, setMsgEditSocio] = useState("");

  const [editProf, setEditProf] = useState<ProfesionalRow | null>(null);
  const [editProfNombre, setEditProfNombre] = useState("");
  const [editProfProfesion, setEditProfProfesion] = useState("");
  const [editProfFuncion, setEditProfFuncion] = useState("");
  const [editProfRol, setEditProfRol] = useState<PuestoCatalogo>("DIRECTOR");
  const [guardEditProf, setGuardEditProf] = useState(false);
  const [msgEditProf, setMsgEditProf] = useState("");

  const [busquedaLista, setBusquedaLista] = useState("");

  const [reaCampo, setReaCampo] = useState<CampoReasignacionMasiva>("profesionalACargoId");
  const [reaDesdeId, setReaDesdeId] = useState("");
  const [reaHaciaId, setReaHaciaId] = useState("");
  const [reaDescMas, setReaDescMas] = useState(
    "Reasignacion masiva: baja o cambio en el departamento.",
  );
  const [reaMsgMas, setReaMsgMas] = useState("");
  const [reaEjecutando, setReaEjecutando] = useState(false);

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
        setErrorLista((prev) => prev || (j.error ?? "No se pudo cargar el equipo."));
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

  useEffect(() => {
    if (!eliminar) {
      setPendientesMiembro(null);
      setCargandoPendientes(false);
      return;
    }
    const ac = new AbortController();
    setCargandoPendientes(true);
    setPendientesMiembro(null);
    const q =
      eliminar.kind === "socio"
        ? `socioId=${encodeURIComponent(eliminar.id)}`
        : `profesionalId=${encodeURIComponent(eliminar.id)}`;
    void fetch(`/api/maestros/asuntos-pendientes-miembro?${q}`, { signal: ac.signal })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          total?: number;
          porRol?: Partial<Record<CampoReasignacionMasiva, number>>;
        };
        if (!r.ok || typeof data.total !== "number" || !data.porRol) {
          if (!ac.signal.aborted) setPendientesMiembro(null);
          return;
        }
        if (!ac.signal.aborted) {
          setPendientesMiembro({ total: data.total, porRol: data.porRol });
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setPendientesMiembro(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setCargandoPendientes(false);
      });
    return () => ac.abort();
  }, [eliminar?.id, eliminar?.kind]);

  const legalACargoCount = useMemo(
    () => profesionales.filter((p) => p.grupo === "LEGAL_A_CARGO").length,
    [profesionales],
  );

  const filasLista = useMemo((): FilaLista[] => {
    const sRows: FilaLista[] = socios.map((s) => ({
      key: `socio-${s.id}`,
      tipo: "socio",
      id: s.id,
      nombre: s.nombre,
      rolEtiqueta: "Socio",
      areaEtiqueta: "Socio",
      profesion: s.profesion,
      funcion: s.funcion,
    }));
    const pRows: FilaLista[] = profesionales.map((p) => ({
      key: `equipo-${p.id}`,
      tipo: "equipo",
      id: p.id,
      nombre: p.nombre,
      rolEtiqueta: ETIQUETA_PUESTO[p.puesto],
      areaEtiqueta: ETIQUETA_GRUPO[p.grupo],
      profesion: p.profesion,
      funcion: p.funcion,
    }));
    return [...sRows, ...pRows].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );
  }, [socios, profesionales]);

  const filasListaFiltradas = useMemo(
    () => filasLista.filter((row) => nombreCoincideBusqueda(row.nombre, busquedaLista)),
    [filasLista, busquedaLista],
  );

  const opcionesDesdeRea = useMemo(() => {
    if (reaCampo === "socioReferenteId") {
      return socios.map((s) => ({ id: s.id, nombre: s.nombre }));
    }
    if (reaCampo === "profesionalACargoId") {
      return profesionales
        .filter((p) => p.grupo === "LEGAL_A_CARGO")
        .map((p) => ({ id: p.id, nombre: `${p.nombre} (${ETIQUETA_PUESTO[p.puesto]})` }));
    }
    if (reaCampo === "contadorReferenteId") {
      return profesionales.filter((p) => p.grupo === "CONTADOR").map((p) => ({ id: p.id, nombre: p.nombre }));
    }
    return profesionales
      .filter((p) => p.grupo === "LEGAL_COLABORADOR")
      .map((p) => ({ id: p.id, nombre: p.nombre }));
  }, [reaCampo, socios, profesionales]);

  const opcionesHaciaRea = useMemo(
    () => opcionesDesdeRea.filter((o) => o.id !== reaDesdeId),
    [opcionesDesdeRea, reaDesdeId],
  );

  useEffect(() => {
    if (omitirResetReaDesdeRef.current) {
      omitirResetReaDesdeRef.current = false;
      return;
    }
    setReaDesdeId("");
    setReaHaciaId("");
  }, [reaCampo]);

  function irAReasignacionDesdeEliminar() {
    if (!eliminar) return;
    const miembroId = eliminar.id;
    const porRol = pendientesMiembro?.porRol ?? {};
    const campo: CampoReasignacionMasiva =
      eliminar.kind === "socio"
        ? "socioReferenteId"
        : (ORDEN_CAMPO_REA_PROF.find((c) => (porRol[c] ?? 0) > 0) ?? "profesionalACargoId");
    setMsgEliminar("");
    setEliminar(null);
    setReaHaciaId("");
    setReaCampo((prev) => {
      if (prev !== campo) {
        omitirResetReaDesdeRef.current = true;
      }
      return campo;
    });
    setReaDesdeId(miembroId);
    requestAnimationFrame(() => {
      reasignacionMasivaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function ejecutarReasignacionMasiva() {
    setReaMsgMas("");
    if (!reaDesdeId || !reaHaciaId) {
      setReaMsgMas("Elegí quién deja el rol y el reemplazo.");
      return;
    }
    if (
      !window.confirm(
        "Se actualizarán todos los asuntos EN TRAMITE donde esa persona figure en el rol elegido. ¿Continuar?",
      )
    ) {
      return;
    }
    setReaEjecutando(true);
    try {
      const response = await fetch("/api/asuntos/reasignacion-masiva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campo: reaCampo,
          desdeId: reaDesdeId,
          haciaId: reaHaciaId,
          descripcionSeguimiento: reaDescMas.trim() || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; actualizados?: number; mensaje?: string };
      if (!response.ok) {
        setReaMsgMas(data.error ?? "No se pudo reasignar.");
        return;
      }
      setReaMsgMas(data.mensaje ?? `Listo: ${data.actualizados ?? 0} asunto(s).`);
      setReaHaciaId("");
    } catch {
      setReaMsgMas("Error de red.");
    } finally {
      setReaEjecutando(false);
    }
  }

  function abrirEditarSocio(s: SocioRow) {
    setEditSocio(s);
    setEditSocNombre(s.nombre);
    setEditSocProfesion(s.profesion);
    setEditSocFuncion(s.funcion);
    setMsgEditSocio("");
  }

  function abrirEditarProf(p: ProfesionalRow) {
    setEditProf(p);
    setEditProfNombre(p.nombre);
    setEditProfProfesion(p.profesion);
    setEditProfFuncion(p.funcion);
    setEditProfRol(p.puesto);
    setMsgEditProf("");
  }

  async function guardarEditSocio(e: React.FormEvent) {
    e.preventDefault();
    if (!editSocio) return;
    const n = editSocNombre.trim();
    const pr = editSocProfesion.trim();
    const f = editSocFuncion.trim();
    if (!n) {
      setMsgEditSocio("El nombre es obligatorio.");
      return;
    }
    setGuardEditSocio(true);
    setMsgEditSocio("");
    try {
      const response = await fetch(`/api/socios/${editSocio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n, profesion: pr, funcion: f }),
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
      setGuardEditSocio(false);
    }
  }

  async function guardarEditProf(e: React.FormEvent) {
    e.preventDefault();
    if (!editProf) return;
    const n = editProfNombre.trim();
    const pr = editProfProfesion.trim();
    const f = editProfFuncion.trim();
    if (!n) {
      setMsgEditProf("El nombre es obligatorio.");
      return;
    }
    if (puestoRequiereFuncionEnEstudio(editProfRol) && !f) {
      setMsgEditProf("La funcion en el estudio es obligatoria para este rol.");
      return;
    }
    setGuardEditProf(true);
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
      setGuardEditProf(false);
    }
  }

  async function ejecutarEliminar() {
    if (!eliminar || eliminar.paso !== 2) return;
    if (pendientesMiembro && pendientesMiembro.total > 0) {
      setMsgEliminar(
        "Hay asuntos en trámite con esta persona. Usá la reasignación masiva antes de eliminar.",
      );
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
    const n = socNombre.trim();
    const pr = socProfesion.trim();
    const f = socFuncion.trim();
    if (!n) {
      setMsgSoc("El nombre es obligatorio.");
      return;
    }
    setGuardSoc(true);
    setMsgSoc("");
    try {
      const response = await fetch("/api/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: n, profesion: pr, funcion: f }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgSoc(data.error ?? "No se pudo crear el socio.");
        return;
      }
      setSocNombre("");
      setSocProfesion("");
      setSocFuncion("");
      setMsgSoc("Socio creado correctamente.");
      await cargar();
    } catch {
      setMsgSoc("Error de red.");
    } finally {
      setGuardSoc(false);
    }
  }

  async function onSubmitEquipo(e: React.FormEvent) {
    e.preventDefault();
    const n = eqNombre.trim();
    const pr = eqProfesion.trim();
    const f = eqFuncion.trim();
    if (!n) {
      setMsgEq("El nombre es obligatorio.");
      return;
    }
    if (puestoRequiereFuncionEnEstudio(eqRol) && !f) {
      setMsgEq("Para este rol la funcion en el estudio es obligatoria.");
      return;
    }
    setGuardEq(true);
    setMsgEq("");
    try {
      const response = await fetch("/api/profesionales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          rol: eqRol,
          profesion: pr,
          funcion: f,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMsgEq(data.error ?? "No se pudo dar de alta.");
        return;
      }
      setEqNombre("");
      setEqRol("ESCRIBANO");
      setEqProfesion("");
      setEqFuncion("");
      setMsgEq("Miembro del equipo creado correctamente.");
      await cargar();
    } catch {
      setMsgEq("Error de red.");
    } finally {
      setGuardEq(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {errorLista ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {errorLista}
        </p>
      ) : null}

      {eliminar ? (
        <div
          className="fixed inset-0 z-50 flex min-h-0 items-center justify-center bg-black/40 p-3 sm:p-4"
          role="presentation"
          onClick={() => {
            if (!eliminando) setEliminar(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-titulo"
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-xl border border-blue-200 bg-white p-4 shadow-xl sm:max-h-[90dvh] sm:p-5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 id="eliminar-titulo" className="text-lg font-semibold text-blue-950">
              {eliminar.paso === 1 ? "Confirmar eliminacion" : "Ultima confirmacion"}
            </h2>
            {eliminar.paso === 1 ? (
              <p className="mt-3 text-sm text-blue-900/90">
                ¿Eliminar <span className="font-semibold text-blue-950">{eliminar.etiqueta}</span>?
              </p>
            ) : (
              <p className="mt-3 text-sm text-blue-900/90">
                Segunda confirmación: se eliminará permanentemente{" "}
                <span className="font-semibold text-blue-950">{eliminar.etiqueta}</span>.
              </p>
            )}
            {eliminar.paso === 1 && cargandoPendientes ? (
              <p className="mt-2 text-sm text-blue-800/80">Comprobando asuntos en trámite…</p>
            ) : null}
            {eliminar.paso === 1 &&
            !cargandoPendientes &&
            pendientesMiembro &&
            pendientesMiembro.total > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                <p className="font-medium">
                  {pendientesMiembro.total === 1
                    ? "Hay 1 asunto en trámite que referencia a esta persona."
                    : `Hay ${pendientesMiembro.total} asuntos en trámite que referencian a esta persona.`}
                </p>
                <p className="mt-1 text-amber-950/90">
                  Reasignalos en bloque desde la sección inferior antes de eliminar el registro.
                </p>
              </div>
            ) : null}
            {msgEliminar ? <p className="mt-2 text-sm text-red-700">{msgEliminar}</p> : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={btnSec}
                disabled={eliminando}
                onClick={() => {
                  if (!eliminando) {
                    setMsgEliminar("");
                    setEliminar(null);
                  }
                }}
              >
                Cancelar
              </button>
              {eliminar.paso === 1 ? (
                cargandoPendientes ? null : pendientesMiembro && pendientesMiembro.total > 0 ? (
                  <button
                    type="button"
                    className="rounded-md border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-950 transition-colors hover:bg-amber-200"
                    disabled={eliminando}
                    onClick={() => irAReasignacionDesdeEliminar()}
                  >
                    Ir a reasignación masiva
                  </button>
                ) : (
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
                )
              ) : (
                <button
                  type="button"
                  className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60"
                  disabled={
                    eliminando || (!!pendientesMiembro && pendientesMiembro.total > 0)
                  }
                  onClick={() => void ejecutarEliminar()}
                >
                  {eliminando ? "Eliminando…" : "Eliminar definitivamente"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {editSocio ? (
        <div
          className="fixed inset-0 z-50 flex min-h-0 items-center justify-center bg-black/40 p-3 sm:p-4"
          role="presentation"
          onClick={() => {
            if (!guardEditSocio) setEditSocio(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-xl border border-blue-200 bg-white p-4 shadow-xl sm:max-h-[90dvh] sm:p-5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-blue-950">Editar socio</h2>
            <p className="mt-1 text-sm text-blue-800/75">Rol: Socio (fijo).</p>
            <form className="mt-4 space-y-3" onSubmit={(e) => void guardarEditSocio(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">Nombre *</label>
                <input
                  className={inputClass}
                  value={editSocNombre}
                  onChange={(e) => setEditSocNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">
                  Profesión (opcional)
                </label>
                <input
                  className={inputClass}
                  value={editSocProfesion}
                  onChange={(e) => setEditSocProfesion(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">
                  Función en el estudio (opcional)
                </label>
                <input
                  className={inputClass}
                  value={editSocFuncion}
                  onChange={(e) => setEditSocFuncion(e.target.value)}
                />
              </div>
              {msgEditSocio ? <p className="text-sm text-red-700">{msgEditSocio}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={btnSec}
                  disabled={guardEditSocio}
                  onClick={() => setEditSocio(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardEditSocio}
                  className="rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-950 disabled:opacity-60"
                >
                  {guardEditSocio ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editProf ? (
        <div
          className="fixed inset-0 z-50 flex min-h-0 items-center justify-center bg-black/40 p-3 sm:p-4"
          role="presentation"
          onClick={() => {
            if (!guardEditProf) setEditProf(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85dvh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-xl border border-blue-200 bg-white p-4 shadow-xl sm:max-h-[90dvh] sm:p-5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-blue-950">Editar miembro del equipo</h2>
            <p className="mt-1 text-sm text-blue-800/75">
              Área actual: {ETIQUETA_GRUPO[grupoDesdePuesto(editProfRol)]} — el rol define el área.
            </p>
            <form className="mt-4 space-y-3" onSubmit={(e) => void guardarEditProf(e)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">Nombre *</label>
                <input
                  className={inputClass}
                  value={editProfNombre}
                  onChange={(e) => setEditProfNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">Rol *</label>
                <select
                  className={inputClass}
                  value={editProfRol}
                  onChange={(e) => setEditProfRol(e.target.value as PuestoCatalogo)}
                >
                  {PUESTOS_EQUIPO_ORDEN.map((pu) => (
                    <option key={pu} value={pu}>
                      {ETIQUETA_PUESTO[pu]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">
                  Profesión (opcional)
                </label>
                <input
                  className={inputClass}
                  value={editProfProfesion}
                  onChange={(e) => setEditProfProfesion(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-950">
                  Función en el estudio
                  {!puestoRequiereFuncionEnEstudio(editProfRol) ? (
                    <span className="font-normal text-blue-800/70"> (opcional en dirección)</span>
                  ) : null}
                </label>
                <input
                  className={inputClass}
                  value={editProfFuncion}
                  onChange={(e) => setEditProfFuncion(e.target.value)}
                />
              </div>
              {msgEditProf ? <p className="text-sm text-red-700">{msgEditProf}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={btnSec}
                  disabled={guardEditProf}
                  onClick={() => setEditProf(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardEditProf}
                  className="rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-950 disabled:opacity-60"
                >
                  {guardEditProf ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4 rounded-xl border border-blue-200/80 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-blue-950">Alta de Socio</h2>
            <p className="mt-1 text-sm text-blue-800/75">
              Nombre obligatorio. Rol fijo: <strong>Socio</strong>. Profesión y función son opcionales.
            </p>
          </div>
          <form className="space-y-3" onSubmit={(e) => void onSubmitSocio(e)}>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-soc-nombre">
                Nombre *
              </label>
              <input
                id="alta-soc-nombre"
                className={inputClass}
                value={socNombre}
                onChange={(e) => setSocNombre(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-soc-prof">
                Profesión (opcional)
              </label>
              <input
                id="alta-soc-prof"
                className={inputClass}
                value={socProfesion}
                onChange={(e) => setSocProfesion(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-soc-func">
                Función en el estudio (opcional)
              </label>
              <input
                id="alta-soc-func"
                className={inputClass}
                value={socFuncion}
                onChange={(e) => setSocFuncion(e.target.value)}
              />
            </div>
            {msgSoc ? (
              <p
                className={
                  msgSoc.includes("correctamente") ? "text-sm text-emerald-700" : "text-sm text-red-700"
                }
              >
                {msgSoc}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={guardSoc}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-950 disabled:opacity-60"
            >
              {guardSoc ? "Guardando…" : "Dar de alta socio"}
            </button>
          </form>
        </div>

        <div className="space-y-4 rounded-xl border border-blue-200/80 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-blue-950">Alta de Equipo</h2>
            <p className="mt-1 text-sm text-blue-800/75">
              Nombre y rol obligatorios. El rol define el área (dirección, legal, colaborador, contador).
              Profesión opcional. Función obligatoria salvo director/gerente.
            </p>
          </div>
          <form className="space-y-3" onSubmit={(e) => void onSubmitEquipo(e)}>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-eq-nombre">
                Nombre *
              </label>
              <input
                id="alta-eq-nombre"
                className={inputClass}
                value={eqNombre}
                onChange={(e) => setEqNombre(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-eq-rol">
                Rol *
              </label>
              <select
                id="alta-eq-rol"
                className={inputClass}
                value={eqRol}
                onChange={(e) => setEqRol(e.target.value as PuestoCatalogo)}
              >
                {PUESTOS_EQUIPO_ORDEN.map((pu) => (
                  <option key={pu} value={pu}>
                    {ETIQUETA_PUESTO[pu]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-eq-prof">
                Profesión (opcional)
              </label>
              <input
                id="alta-eq-prof"
                className={inputClass}
                value={eqProfesion}
                onChange={(e) => setEqProfesion(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-blue-950" htmlFor="alta-eq-func">
                Función en el estudio
                {!puestoRequiereFuncionEnEstudio(eqRol) ? (
                  <span className="font-normal text-blue-800/70"> (opcional)</span>
                ) : (
                  <span className="font-normal text-red-800/80"> *</span>
                )}
              </label>
              <input
                id="alta-eq-func"
                className={inputClass}
                value={eqFuncion}
                onChange={(e) => setEqFuncion(e.target.value)}
              />
            </div>
            {msgEq ? (
              <p
                className={
                  msgEq.includes("correctamente") ? "text-sm text-emerald-700" : "text-sm text-red-700"
                }
              >
                {msgEq}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={guardEq}
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-950 disabled:opacity-60"
            >
              {guardEq ? "Guardando…" : "Dar de alta equipo"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200/80 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-blue-950">Listado unificado</h2>
            <p className="mt-1 text-sm text-blue-800/75">
              Socios y Equipo en un solo listado. Para nuevos asuntos hace falta al menos un socio y un
              profesional a cargo (escribano o abogado).
            </p>
            {!cargando && legalACargoCount === 0 ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Aún no hay escribano/abogado a cargo en el equipo.
              </p>
            ) : null}
          </div>
          <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-sm">
            <label
              className="mb-1 block text-xs font-medium text-blue-900/85"
              htmlFor="busqueda-lista-maestros"
            >
              Buscar por nombre
            </label>
            <input
              id="busqueda-lista-maestros"
              type="search"
              className={inputClass}
              placeholder="Filtrar el listado…"
              value={busquedaLista}
              onChange={(e) => setBusquedaLista(e.target.value)}
              autoComplete="off"
              disabled={cargando || filasLista.length === 0}
            />
          </div>
        </div>
        {cargando ? (
          <p className="text-sm text-blue-800/70">Cargando…</p>
        ) : filasLista.length === 0 ? (
          <p className="text-sm text-blue-800/70">No hay registros.</p>
        ) : filasListaFiltradas.length === 0 ? (
          <p className="text-sm text-blue-800/70">
            No hay coincidencias{busquedaLista.trim() ? ` para «${busquedaLista.trim()}»` : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm text-blue-950">
              <thead>
                <tr className="border-b border-blue-200 text-xs font-semibold uppercase tracking-wide text-blue-800/85">
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Rol</th>
                  <th className="py-2 pr-3">Área</th>
                  <th className="py-2 pr-3">Profesión</th>
                  <th className="py-2 pr-3">Función</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filasListaFiltradas.map((row) => (
                  <tr key={row.key} className="border-b border-blue-100/80">
                    <td className="py-2.5 pr-3">
                      <span
                        className={
                          row.tipo === "socio"
                            ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900"
                            : "rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900"
                        }
                      >
                        {row.tipo === "socio" ? "Socio" : "Equipo"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-medium">{row.nombre}</td>
                    <td className="py-2.5 pr-3 text-blue-900/90">{row.rolEtiqueta}</td>
                    <td className="py-2.5 pr-3 text-blue-800/80">{row.areaEtiqueta}</td>
                    <td className="max-w-[140px] truncate py-2.5 pr-3 text-blue-800/80" title={row.profesion}>
                      {row.profesion || "—"}
                    </td>
                    <td className="max-w-[160px] truncate py-2.5 pr-3 text-blue-800/80" title={row.funcion}>
                      {row.funcion || "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        {row.tipo === "socio" ? (
                          <button
                            type="button"
                            className={btnSec}
                            onClick={() => {
                              const s = socios.find((x) => x.id === row.id);
                              if (s) abrirEditarSocio(s);
                            }}
                          >
                            Editar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={btnSec}
                            onClick={() => {
                              const p = profesionales.find((x) => x.id === row.id);
                              if (p) abrirEditarProf(p);
                            }}
                          >
                            Editar
                          </button>
                        )}
                        <button
                          type="button"
                          className={btnPeligro}
                          onClick={() => {
                            setMsgEliminar("");
                            setEliminar({
                              kind: row.tipo === "socio" ? "socio" : "profesional",
                              id: row.id,
                              etiqueta: row.nombre,
                              paso: 1,
                            });
                          }}
                        >
                          Eliminar
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        ref={reasignacionMasivaRef}
        id="reasignacion-asuntos-en-tramite"
        className="scroll-mt-4 rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 shadow-sm shadow-amber-900/5 sm:p-5"
      >
        <h2 className="text-lg font-semibold text-amber-950">Reasignar asuntos EN TRAMITE (baja del departamento)</h2>
        <p className="mt-1 text-sm text-amber-950/85">
          Reemplaza en bloque a la persona que deja el estudio en un rol concreto. Solo afecta asuntos{" "}
          <strong>en trámite</strong>. Cada asunto recibe una línea en el historial.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-amber-950/90">Rol en el asunto a reemplazar</span>
            <select
              className={inputClass}
              value={reaCampo}
              onChange={(e) => setReaCampo(e.target.value as CampoReasignacionMasiva)}
            >
              {(Object.keys(LABEL_CAMPO_REA) as CampoReasignacionMasiva[]).map((c) => (
                <option key={c} value={c}>
                  {LABEL_CAMPO_REA[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-amber-950/90">Persona que deja / a reemplazar</span>
            <select
              className={inputClass}
              value={reaDesdeId}
              onChange={(e) => setReaDesdeId(e.target.value)}
            >
              <option value="">— Elegir —</option>
              {opcionesDesdeRea.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-amber-950/90">Nueva asignación</span>
            <select
              className={inputClass}
              value={reaHaciaId}
              onChange={(e) => setReaHaciaId(e.target.value)}
            >
              <option value="">— Elegir —</option>
              {opcionesHaciaRea.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 md:col-span-2 lg:col-span-3">
            <span className="text-xs font-medium text-amber-950/90">Texto en historial de cada asunto</span>
            <input
              className={inputClass}
              value={reaDescMas}
              onChange={(e) => setReaDescMas(e.target.value)}
            />
          </label>
        </div>
        {reaMsgMas ? (
          <p
            className={`mt-3 text-sm ${reaMsgMas.includes("Listo") || reaMsgMas.includes("actualizaron") || reaMsgMas.includes("No hay") ? "text-emerald-800" : "text-red-800"}`}
          >
            {reaMsgMas}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-60 sm:w-auto"
          disabled={reaEjecutando || !reaDesdeId || !reaHaciaId}
          onClick={() => void ejecutarReasignacionMasiva()}
        >
          {reaEjecutando ? "Procesando…" : "Reasignar asuntos en trámite"}
        </button>
      </div>
    </div>
  );
}
