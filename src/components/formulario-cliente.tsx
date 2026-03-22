"use client";

import { useMemo, useState } from "react";
import { esCiUruguayValida, esRutValido, limpiarDocumento } from "@/lib/validaciones";

type TipoDocumento = "RUT" | "CI";
type TipoPersona = "FISICA" | "JURIDICA";

type Props = {
  onClienteCreado?: () => void;
};

export function FormularioCliente({ onClienteCreado }: Props) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("RUT");
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>("FISICA");
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  const documentoLimpio = useMemo(() => limpiarDocumento(documento), [documento]);

  function validarDocumento(): string | null {
    if (tipoDocumento === "RUT") {
      return esRutValido(documentoLimpio) ? null : "El RUT debe tener exactamente 12 digitos.";
    }
    return esCiUruguayValida(documentoLimpio) ? null : "La CI ingresada no es valida para Uruguay.";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errorDocumento = validarDocumento();
    if (errorDocumento) {
      setMensaje(errorDocumento);
      return;
    }

    if (!nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    if (!contacto.trim() && !telefono.trim() && !email.trim()) {
      setMensaje("Indica al menos un medio de contacto (contacto general, telefono o email).");
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
          documento: documentoLimpio,
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
      onClienteCreado?.();
    } catch {
      setMensaje("Error de conexion con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

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
            onChange={(e) => setTipoPersona(e.target.value as TipoPersona)}
          >
            <option value="FISICA">Persona fisica</option>
            <option value="JURIDICA">Persona juridica</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Tipo de documento</span>
          <select
            className="input-app"
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
          >
            <option value="RUT">RUT</option>
            <option value="CI">CI</option>
          </select>
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">{tipoDocumento}</span>
          <input
            className="input-app"
            placeholder={tipoDocumento === "RUT" ? "12 digitos" : "CI uruguaya"}
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Nombre / razon social</span>
          <input className="input-app" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Telefono</span>
          <input className="input-app" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-blue-950">Email</span>
          <input
            className="input-app"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Contacto adicional (opcional)</span>
          <input
            className="input-app"
            placeholder="Ej. referencia, otro telefono"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-blue-950">Domicilio (opcional)</span>
          <input className="input-app" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} />
        </label>
      </div>

      <button className="btn-primary" disabled={guardando} type="submit">
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
