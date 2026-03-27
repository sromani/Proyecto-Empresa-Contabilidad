"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type PuestoCatalogo,
  ETIQUETA_PUESTO,
} from "@/lib/profesional-equipo-catalogo";

type TipoAsunto = "TODOS" | "NOTARIAL" | "LEGAL";

type ClienteItem = {
  id: string;
  nombre: string;
  documento: string;
};

type AsuntoItem = {
  id: string;
  nombre: string;
};

type GrupoProfCatalogo = "DIRECCION" | "LEGAL_A_CARGO" | "LEGAL_COLABORADOR" | "CONTADOR";

type ProfesionalItem = {
  id: string;
  nombre: string;
  profesion: string;
  funcion: string;
  grupo: GrupoProfCatalogo;
  puesto: string;
};

function etiquetaPuesto(puesto: string): string {
  return ETIQUETA_PUESTO[puesto as PuestoCatalogo] ?? puesto;
}

type SocioItem = {
  id: string;
  nombre: string;
};

function hoyIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FormularioAsunto() {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoAsunto>("NOTARIAL");
  const [asuntos, setAsuntos] = useState<AsuntoItem[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalItem[]>([]);
  const [socios, setSocios] = useState<SocioItem[]>([]);
  const [clienteElegido, setClienteElegido] = useState<ClienteItem | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<ClienteItem[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [listaClienteAbierta, setListaClienteAbierta] = useState(false);
  const contenedorBusquedaClienteRef = useRef<HTMLDivElement>(null);

  const [asuntoSeleccionado, setAsuntoSeleccionado] = useState("");
  const [nuevoAsunto, setNuevoAsunto] = useState("");
  const [profesionalACargoId, setProfesionalACargoId] = useState("");
  const [colaboradorACargoId, setColaboradorACargoId] = useState("");
  const [colaboradorACargo2Id, setColaboradorACargo2Id] = useState("");
  const [contadorReferenteId, setContadorReferenteId] = useState("");
  const [socioReferente, setSocioReferente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyIsoDate);
  const [fechaAlerta, setFechaAlerta] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const profesionalesLegalACargo = profesionales.filter((p) => p.grupo === "LEGAL_A_CARGO");
  const colaboradoresLegal = profesionales.filter((p) => p.grupo === "LEGAL_COLABORADOR");
  const contadores = profesionales.filter((p) => p.grupo === "CONTADOR");

  const elegiblesColaboracion = useMemo(
    () => colaboradoresLegal.filter((p) => p.id !== profesionalACargoId),
    [colaboradoresLegal, profesionalACargoId],
  );

  const elegiblesColaborador2 = useMemo(
    () =>
      elegiblesColaboracion.filter(
        (p) => !colaboradorACargoId || p.id !== colaboradorACargoId,
      ),
    [elegiblesColaboracion, colaboradorACargoId],
  );

  useEffect(() => {
    setColaboradorACargoId((c) => (c === profesionalACargoId ? "" : c));
    setColaboradorACargo2Id((c2) => (c2 === profesionalACargoId ? "" : c2));
  }, [profesionalACargoId]);

  useEffect(() => {
    setColaboradorACargo2Id((c2) => (c2 && c2 === colaboradorACargoId ? "" : c2));
  }, [colaboradorACargoId]);

  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const response = await fetch("/api/catalogos");
        const data = await response.json();
        if (!response.ok) {
          setMensaje(data?.error ?? "No se pudieron cargar los catalogos.");
          return;
        }

        const asuntosData = (data?.asuntos ?? []) as AsuntoItem[];
        const profesionalesData = (data?.profesionales ?? []) as ProfesionalItem[];
        const sociosData = (data?.socios ?? []) as SocioItem[];

        setAsuntos(asuntosData);
        setProfesionales(profesionalesData);
        setSocios(sociosData);
        setAsuntoSeleccionado(asuntosData[0]?.nombre ?? "");
        setSocioReferente(sociosData[0]?.id ?? "");
        setProfesionalACargoId(
          profesionalesData.find((p) => p.grupo === "LEGAL_A_CARGO")?.id ?? "",
        );
        setContadorReferenteId(profesionalesData.find((p) => p.grupo === "CONTADOR")?.id ?? "");
      } catch {
        setMensaje("Error al cargar catalogos.");
      } finally {
        setCargando(false);
      }
    }

    void cargarCatalogos().catch(() => {
      setMensaje("Error al cargar catalogos.");
      setCargando(false);
    });
  }, []);

  useEffect(() => {
    const q = busquedaCliente.trim();
    if (q.length < 2) {
      setResultadosCliente([]);
      setBuscandoClientes(false);
      return;
    }
    const handle = window.setTimeout(() => {
      setBuscandoClientes(true);
      void fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
        .then(async (response) => {
          const data = (await response.json().catch(() => [])) as unknown;
          if (!response.ok || !Array.isArray(data)) {
            setResultadosCliente([]);
            return;
          }
          setResultadosCliente(
            data.map((row) => ({
              id: String((row as ClienteItem).id),
              nombre: String((row as ClienteItem).nombre),
              documento: String((row as ClienteItem).documento),
            })),
          );
        })
        .catch(() => setResultadosCliente([]))
        .finally(() => setBuscandoClientes(false));
    }, 320);
    return () => window.clearTimeout(handle);
  }, [busquedaCliente]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = contenedorBusquedaClienteRef.current;
      if (el && !el.contains(e.target as Node)) {
        setListaClienteAbierta(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function agregarNuevoAsunto() {
    const limpio = nuevoAsunto.trim();
    if (!limpio) {
      setMensaje("Escribi un nombre para el nuevo asunto.");
      return;
    }
    if (asuntos.some((asunto) => asunto.nombre.toLowerCase() === limpio.toLowerCase())) {
      setMensaje("Ese asunto ya existe en la lista.");
      return;
    }
    const actualizados = [...asuntos, { id: `tmp-${Date.now()}`, nombre: limpio }];
    setAsuntos(actualizados);
    setAsuntoSeleccionado(limpio);
    setNuevoAsunto("");
    setMensaje(`Asunto "${limpio}" agregado (se creara en catalogo al guardar).`);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!clienteElegido?.id) {
      setMensaje("Debes buscar y seleccionar un cliente.");
      return;
    }

    if (!asuntoSeleccionado.trim()) {
      setMensaje("Debes seleccionar o crear un asunto de catalogo.");
      return;
    }

    if (!profesionalACargoId) {
      setMensaje("Debés indicar el equipo a cargo.");
      return;
    }

    if (!socioReferente) {
      setMensaje("Debes definir un socio referente.");
      return;
    }

    if (
      colaboradorACargoId &&
      colaboradorACargo2Id &&
      colaboradorACargoId === colaboradorACargo2Id
    ) {
      setMensaje("Los dos colaboradores deben ser personas distintas.");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch("/api/asuntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          clienteId: clienteElegido.id,
          asuntoNombre: asuntoSeleccionado.trim(),
          profesionalACargoId,
          colaboradorACargoId: colaboradorACargoId || null,
          colaboradorACargo2Id: colaboradorACargo2Id || null,
          contadorReferenteId: contadorReferenteId || null,
          socioReferenteId: socioReferente,
          descripcion: descripcion.trim() || null,
          fechaInicio: fechaInicio || undefined,
          fechaAlertaVencimiento: fechaAlerta || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo crear el asunto.");
        return;
      }

      router.push(`/asuntos/${data.id}`);
    } catch {
      setMensaje("Error de conexion con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <p className="rounded-xl border border-blue-200 bg-white/90 p-4 text-sm text-blue-900 shadow-blue-soft">
        Cargando catalogos...
      </p>
    );
  }

  return (
    <form className="card-app space-y-6" onSubmit={onSubmit}>
      <div className="border-b border-blue-100 pb-4">
        <h2 className="text-xl font-semibold text-blue-950">Nuevo Asunto</h2>
        <p className="mt-1 text-sm text-blue-800/70">
          Tipo, cliente, catalogo, equipo a cargo obligatorio y fechas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Cliente</span>
          {clienteElegido ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
              <span className="min-w-0 flex-1 font-medium">
                {clienteElegido.nombre}{" "}
                <span className="font-normal text-emerald-900/80">— {clienteElegido.documento}</span>
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md border border-emerald-300/80 bg-white px-2.5 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100/80"
                onClick={() => {
                  setClienteElegido(null);
                  setBusquedaCliente("");
                  setResultadosCliente([]);
                  setListaClienteAbierta(false);
                }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div ref={contenedorBusquedaClienteRef} className="relative">
              <input
                type="search"
                autoComplete="off"
                className="input-app w-full"
                placeholder="Ej. Garcia o 12345678"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setListaClienteAbierta(true);
                }}
                onFocus={() => setListaClienteAbierta(true)}
                aria-autocomplete="list"
                aria-expanded={listaClienteAbierta}
                aria-controls="lista-busqueda-clientes"
              />
              {listaClienteAbierta && busquedaCliente.trim().length >= 2 ? (
                <ul
                  id="lista-busqueda-clientes"
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-blue-200 bg-white py-1 text-sm shadow-lg shadow-blue-950/10"
                >
                  {buscandoClientes ? (
                    <li className="px-3 py-2 text-blue-800/70">Buscando...</li>
                  ) : resultadosCliente.length === 0 ? (
                    <li className="px-3 py-2 text-blue-800/70">Sin resultados.</li>
                  ) : (
                    resultadosCliente.map((c) => (
                      <li key={c.id} role="option">
                        <button
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-blue-50"
                          onClick={() => {
                            setClienteElegido(c);
                            setBusquedaCliente("");
                            setResultadosCliente([]);
                            setListaClienteAbierta(false);
                          }}
                        >
                          <span className="font-medium text-blue-950">{c.nombre}</span>
                          <span className="text-xs text-blue-800/75">{c.documento}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          )}
          <p className="text-xs text-blue-800/65">
            Buscá por nombre o documento (minimo 2 caracteres). La lista puede ser muy grande.
          </p>
        </div>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Tipo de asunto</span>
          <select
            className="input-app"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAsunto)}
          >
            <option value="TODOS">Todos</option>
            <option value="NOTARIAL">Notarial</option>
            <option value="LEGAL">Legal</option>
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Asunto (catalogo)</span>
          <select
            className="input-app"
            value={asuntoSeleccionado}
            onChange={(e) => setAsuntoSeleccionado(e.target.value)}
          >
            {asuntos.length === 0 ? <option value="">Sin asuntos en catalogo</option> : null}
            {asuntos.map((asunto) => (
              <option key={asunto.id} value={asunto.nombre}>
                {asunto.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input-app flex-1"
            placeholder="Agregar nuevo asunto al catalogo"
            value={nuevoAsunto}
            onChange={(e) => setNuevoAsunto(e.target.value)}
          />
          <button
            className="btn-secondary shrink-0 px-4 py-2 text-sm"
            onClick={agregarNuevoAsunto}
            type="button"
          >
            Agregar
          </button>
        </div>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-blue-950">Descripcion libre (opcional)</span>
        <textarea
          className="input-app min-h-20 resize-y"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Fecha de inicio</span>
          <input
            className="input-app"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Alerta vencimiento (opcional)</span>
          <input
            className="input-app"
            type="date"
            value={fechaAlerta}
            onChange={(e) => setFechaAlerta(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Equipo a cargo *</span>
          <select
            className="input-app"
            value={profesionalACargoId}
            onChange={(e) => setProfesionalACargoId(e.target.value)}
          >
            {profesionalesLegalACargo.length === 0 ? (
              <option value="">Sin profesionales a cargo en maestros</option>
            ) : null}
            {profesionalesLegalACargo.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {etiquetaPuesto(p.puesto)}
                {p.funcion ? ` (${p.funcion})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Colaborador 1 (opcional)</span>
          <select
            className="input-app"
            value={colaboradorACargoId}
            onChange={(e) => setColaboradorACargoId(e.target.value)}
          >
            <option value="">—</option>
            {elegiblesColaboracion.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {etiquetaPuesto(p.puesto)}
                {p.funcion ? ` (${p.funcion})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Colaborador 2 (opcional)</span>
          <select
            className="input-app"
            value={colaboradorACargo2Id}
            onChange={(e) => setColaboradorACargo2Id(e.target.value)}
          >
            <option value="">—</option>
            {elegiblesColaborador2.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {etiquetaPuesto(p.puesto)}
                {p.funcion ? ` (${p.funcion})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Contador referente (opcional)</span>
          <select
            className="input-app"
            value={contadorReferenteId}
            onChange={(e) => setContadorReferenteId(e.target.value)}
          >
            <option value="">—</option>
            {contadores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.funcion ? ` — ${p.funcion}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-800/65">
            Los contadores se cargan en Maestros, sección Contador.
          </p>
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-blue-950">Socio referente</span>
        <select
          className="input-app"
          value={socioReferente}
          onChange={(e) => setSocioReferente(e.target.value)}
        >
          {socios.length === 0 ? <option value="">Sin socios</option> : null}
          {socios.map((socio) => (
            <option key={socio.id} value={socio.id}>
              {socio.nombre}
            </option>
          ))}
        </select>
      </label>

      <button className="btn-primary" disabled={guardando} type="submit">
        {guardando ? "Guardando..." : "Crear asunto"}
      </button>

      {mensaje ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950">
          {mensaje}
        </p>
      ) : null}
    </form>
  );
}
