import { EstadoAsunto, TipoPersona, type TipoDocumento } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import {
  esTipoDocumentoCliente,
  mensajeValidacionDocumentoCliente,
  normalizarNombrePersona,
  normalizarDocumentoCliente,
} from "@/lib/validaciones";

type Params = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const nombre =
      body?.nombre !== undefined ? normalizarNombrePersona(String(body.nombre)) : undefined;
    const tipoDocumentoRaw =
      body?.tipoDocumento !== undefined ? String(body.tipoDocumento).toUpperCase() : undefined;
    const tipoPersonaRaw =
      body?.tipoPersona !== undefined ? String(body.tipoPersona).toUpperCase() : undefined;
    const tipoPersona =
      tipoPersonaRaw === "FISICA" || tipoPersonaRaw === "JURIDICA"
        ? (tipoPersonaRaw as TipoPersona)
        : tipoPersonaRaw !== undefined
          ? null
          : undefined;
    const documentoInput = body?.documento !== undefined ? String(body.documento) : undefined;
    const contacto = body?.contacto !== undefined ? String(body.contacto).trim() || null : undefined;
    const telefono = body?.telefono !== undefined ? String(body.telefono).trim() || null : undefined;
    const email = body?.email !== undefined ? String(body.email).trim() || null : undefined;
    const domicilio = body?.domicilio !== undefined ? String(body.domicilio).trim() || null : undefined;

    const existente = await prisma.cliente.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
    }

    if (tipoDocumentoRaw !== undefined && !esTipoDocumentoCliente(tipoDocumentoRaw)) {
      return NextResponse.json({ error: "Tipo de documento invalido." }, { status: 400 });
    }
    if (tipoPersona === null) {
      return NextResponse.json({ error: "Tipo de persona invalido." }, { status: 400 });
    }

    const tipoDocFinal = (tipoDocumentoRaw ?? existente.tipoDocumento) as TipoDocumento;
    const docFinal =
      documentoInput !== undefined
        ? normalizarDocumentoCliente(tipoDocFinal, documentoInput)
        : existente.documento;

    const errDoc = mensajeValidacionDocumentoCliente(
      tipoDocFinal,
      documentoInput !== undefined ? documentoInput : docFinal,
    );
    if (errDoc) {
      return NextResponse.json({ error: errDoc }, { status: 400 });
    }

    const actualizado = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(tipoDocumentoRaw !== undefined ? { tipoDocumento: tipoDocFinal } : {}),
        ...(tipoPersona !== undefined ? { tipoPersona: tipoPersona as TipoPersona } : {}),
        ...(documentoInput !== undefined ? { documento: docFinal } : {}),
        ...(contacto !== undefined ? { contacto } : {}),
        ...(telefono !== undefined ? { telefono } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(domicilio !== undefined ? { domicilio } : {}),
      },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "CLIENTE_ACTUALIZAR",
      entidad: "Cliente",
      entidadId: id,
      detalle: { campos: Object.keys(body ?? {}) },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Ya existe otro cliente con ese documento." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el cliente." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const enTramite = await prisma.asunto.count({
      where: { clienteId: id, estado: EstadoAsunto.EN_TRAMITE },
    });
    if (enTramite > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar: el cliente tiene asuntos EN TRAMITE." },
        { status: 409 },
      );
    }

    const totalAsuntos = await prisma.asunto.count({ where: { clienteId: id } });
    if (totalAsuntos > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: el cliente tiene asuntos en historial. Contactar administracion para archivo/migracion.",
        },
        { status: 409 },
      );
    }

    await prisma.cliente.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "CLIENTE_ELIMINAR",
      entidad: "Cliente",
      entidadId: id,
      detalle: {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el cliente." }, { status: 503 });
  }
}
