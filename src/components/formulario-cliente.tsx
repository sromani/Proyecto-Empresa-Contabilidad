"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ETIQUETA_TIPO_DOCUMENTO_CLIENTE,
  ETIQUETA_TIPO_PERSONA_CLIENTE,
  etiquetaTipoDocumentoCliente,
  mensajeValidacionDocumentoCliente,
  normalizarNombrePersona,
  normalizarDocumentoCliente,
  TIPOS_DOCUMENTO_CLIENTE,
  TIPOS_PERSONA_CLIENTE,
  type TipoDocumentoCliente,
  type TipoPersonaCliente,
} from "@/lib/validaciones";

type ClienteCiExistente = {
  id: string;
  nombre: string;
  tipoDocumento: string;
  tipoPersona: string;
  documento: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  domicilio: string | null;
};

type Props = {
  onClienteCreado?: () => void;
};

export function FormularioCliente({ onClienteCreado }: Props) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCliente>("CI");
  const [tipoPersona, setTipoPersona] = useState<TipoPersonaCliente>("FISICA");
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ciExistente, setCiExistente] = useState<ClienteCiExistente | null>(null);
  const [buscandoCi, setBuscandoCi] = useState(false);
  /** Hubo autocompletado desde el servidor; si luego la CI no existe, se limpian esos campos. */
  const huboAutocompletadoRef = useRef(false);

  const documentoNormalizado =
    tipoDocumento === "CI" ? normalizarDocumentoCliente("CI", documento) : "";

  function validarDocumento(): string | null {
    return mensajeValidacionDocumentoCliente(tipoDocumento, documento);
  }

  useEffect(() => {
    if (tipoDocumento !== "CI") {
      setCiExistente(null);
      setBuscandoCi(false);
      huboAutocompletadoRef.current = false;
      return;
    }

    const err = mensajeValidacionDocumentoCliente("CI", documento);
    if (err) {
      setCiExistente(null);
      setBuscandoCi(false);
      return;
    }

    const ac = new AbortController();
    setBuscandoCi(true);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const r = await fetch(
            `/api/clientes/por-documento?tipoDocumento=CI&documento=${encodeURIComponent(documento)}`,
            { signal: ac.signal },
          );
          const data = (await r.json()) as {
            encontrado?: boolean;
            cliente?: ClienteCiExistente;
          };
          if (ac.signal.aborted) {
            return;
          }
          if (!r.ok) {
            setCiExistente(null);
            return;
          }
          if (data.encontrado && data.cliente) {
            huboAutocompletadoRef.current = true;
            setCiExistente(data.cliente);
            setTipoPersona(data.cliente.tipoPersona as TipoPersonaCliente);
            setNombre(data.cliente.nombre);
            setContacto(data.cliente.contacto ?? "");
            setTelefono(data.cliente.telefono ?? "");
            setEmail(data.cliente.email ?? "");
            setDomicilio(data.cliente.domicilio ?? "");
            setMensaje("");
          } else {
            setCiExistente(null);
            if (huboAutocompletadoRef.current) {
              huboAutocompletadoRef.current = false;
              setNombre("");
              setContacto("");
              setTelefono("");
              setEmail("");
              setDomicilio("");
              setTipoPersona("FISICA");
            }
          }
        } catch {
          if (!ac.signal.aborted) {
            setCiExistente(null);
          }
        } finally {
          if (!ac.signal.aborted) {
            setBuscandoCi(false);
          }
        }
      })();
    }, 480);

    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [tipoDocumento, documento]);

  useEffect(() => {
    if (tipoPersona === "JURIDICA" && tipoDocumento === "CI") {
      setTipoDocumento("RUT");
      setCiExistente(null);
      huboAutocompletadoRef.current = false;
    }
  }, [tipoPersona, tipoDocumento]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errorDocumento = validarDocumento();
    if (errorDocumento) {
      setMensaje(errorDocumento);
      return;
    }

    if (tipoDocumento === "CI" && ciExistente) {
      setMensaje(
        "Esta CI ya esta registrada en el sistema. Los datos se completaron solos; no podes dar de alta el mismo cliente otra vez.",
      );
      return;
    }

    if (!nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoDocumento,
          tipoPersona,
          documento: normalizarDocumentoCliente(tipoDocumento, documento),
          nombre,
          contacto: contacto.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          domicilio: domicilio.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo guardar el cliente.");
        return;
      }

      setMensaje(`Cliente "${data.nombre}" guardado correctamente.`);
      setDocumento("");
      setNombre("");
      setContacto("");
      setTelefono("");
      setEmail("");
      setDomicilio("");
      setCiExistente(null);
      huboAutocompletadoRef.current = false;
      onClienteCreado?.();
    } catch {
      setMensaje("Error de conexion con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  const altaBloqueadaPorCi = tipoDocumento === "CI" && ciExistente !== null;

  return (
    <form className="card-app space-y-5" onSubmit={onSubmit}>
      <div className="border-b border-blue-100 pb-4">
        <h2 className="text-xl font-semibold text-blue-950">Alta de Cliente</h2>
        <p className="mt-1 text-sm text-blue-800/70">Datos segun RF: persona, documento y vias de contacto.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Tipo de persona</span>
          <select
            className="input-app"
            value={tipoPersona}
            onChange={(e) => setTipoPersona(e.target.value as TipoPersonaCliente)}
            disabled={altaBloqueadaPorCi}
          >
            {TIPOS_PERSONA_CLIENTE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_PERSONA_CLIENTE[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Tipo de documento</span>
          <select
            className="input-app"
            value={tipoDocumento}
            onChange={(e) => {
              setTipoDocumento(e.target.value as TipoDocumentoCliente);
              setCiExistente(null);
              huboAutocompletadoRef.current = false;
            }}
          >
            {TIPOS_DOCUMENTO_CLIENTE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_DOCUMENTO_CLIENTE[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Numero de documento</span>
          <input
            className="input-app"
            placeholder={
              tipoDocumento === "RUT"
                ? "12 digitos"
                : tipoDocumento === "CI"
                  ? "CI uruguaya"
                  : tipoDocumento === "DNI"
                    ? "6 a 10 digitos"
                    : tipoDocumento === "PASAPORTE"
                      ? "Letras y numeros (5 a 20)"
                      : "Documento extranjero / no estandar"
            }
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
          {tipoDocumento === "CI" && buscandoCi ? (
            <p className="text-xs text-blue-700/80">Comprobando si la CI ya existe...</p>
          ) : null}
        </label>
      </div>

      {altaBloqueadaPorCi ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Esta CI ya esta registrada</p>
          <p className="mt-1 text-amber-900/90">
            Se completaron los datos del cliente existente (documento normalizado:{" "}
            <span className="font-mono">{documentoNormalizado}</span>
            {ciExistente.tipoDocumento !== "CI" ? (
              <>
                {" "}
                — en el sistema figura como{" "}
                <strong>{etiquetaTipoDocumentoCliente(ciExistente.tipoDocumento)}</strong>
              </>
            ) : null}
            ). No se puede repetir el alta con el mismo numero.
          </p>
          <p className="mt-2">
            <Link href="/clientes" className="font-medium text-amber-900 underline">
              Ir al directorio de clientes
            </Link>
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Nombre / razon social</span>
          <input
            className="input-app"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setNombre((v) => normalizarNombrePersona(v))}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Telefono (opcional)</span>
          <input
            className="input-app"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Email (opcional)</span>
          <input
            className="input-app"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Contacto adicional (opcional)</span>
          <input
            className="input-app"
            placeholder="Ej. referencia, otro telefono"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Domicilio (opcional)</span>
          <input
            className="input-app"
            value={domicilio}
            onChange={(e) => setDomicilio(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
      </div>

      <button className="btn-primary" disabled={guardando || altaBloqueadaPorCi} type="submit">
        {guardando ? "Guardando..." : "Guardar cliente"}
      </button>

      {mensaje ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950">
          {mensaje}
        </p>
      ) : null}
    </form>
  );
}
