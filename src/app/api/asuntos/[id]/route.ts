import { EstadoAsunto } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import { puedeFinalizarAsunto, puedeReabrirAsunto } from "@/lib/roles-app";

type Params = { params: Promise<{ id: string }> };

function parseFechaIso(s: unknown): Date | null {
  if (s === undefined || s === null || s === "") {
    return null;
  }
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(_request: Request, context: Params) {
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
    const asunto = await prisma.asunto.findUnique({
      where: { id },
      include: {
        cliente: true,
        catalogo: true,
        socioReferente: true,
        profesionalACargo: true,
        colaboradorACargo: true,
        contadorReferente: true,
        seguimientos: { orderBy: { fecha: "desc" } },
      },
    });

    if (!asunto) {
      return NextResponse.json({ error: "Asunto no encontrado." }, { status: 404 });
    }

    return NextResponse.json(asunto);
  } catch {
    return NextResponse.json({ error: "Error al consultar el asunto." }, { status: 503 });
  }
}

/**
 * PATCH: finalizar o reabrir (RF-03). Body: { accion: "finalizar"|"reabrir", fechaFinalizacion?: ISO }
 */
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
    const accion = String(body?.accion ?? "");

    const actual = await prisma.asunto.findUnique({ where: { id } });
    if (!actual) {
      return NextResponse.json({ error: "Asunto no encontrado." }, { status: 404 });
    }

    if (accion === "finalizar") {
      if (!puedeFinalizarAsunto(auth.sesion.rol)) {
        return NextResponse.json({ error: "No autorizado a finalizar asuntos." }, { status: 403 });
      }
      if (actual.estado !== EstadoAsunto.EN_TRAMITE) {
        return NextResponse.json({ error: "Solo se pueden finalizar asuntos EN TRAMITE." }, { status: 400 });
      }
      const fechaFin = parseFechaIso(body?.fechaFinalizacion);
      if (!fechaFin) {
        return NextResponse.json({ error: "Fecha de finalizacion obligatoria." }, { status: 400 });
      }
      if (fechaFin < actual.fechaInicio) {
        return NextResponse.json(
          { error: "La fecha de finalizacion no puede ser anterior a la fecha de inicio." },
          { status: 400 },
        );
      }

      const actualizado = await prisma.asunto.update({
        where: { id },
        data: {
          estado: EstadoAsunto.FINALIZADO,
          fechaFinalizacion: fechaFin,
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          catalogo: true,
          profesionalACargo: { select: { nombre: true } },
        },
      });

      await registrarAuditoria({
        usuarioId: auth.sesion.sub,
        accion: "ASUNTO_FINALIZAR",
        entidad: "Asunto",
        entidadId: id,
        detalle: { fechaFinalizacion: fechaFin.toISOString() },
      });

      return NextResponse.json(actualizado);
    }

    if (accion === "reabrir") {
      if (!puedeReabrirAsunto(auth.sesion.rol)) {
        return NextResponse.json({ error: "Solo un administrador puede reabrir asuntos." }, { status: 403 });
      }
      if (actual.estado !== EstadoAsunto.FINALIZADO) {
        return NextResponse.json({ error: "Solo se pueden reabrir asuntos FINALIZADOS." }, { status: 400 });
      }

      const actualizado = await prisma.asunto.update({
        where: { id },
        data: {
          estado: EstadoAsunto.EN_TRAMITE,
          fechaFinalizacion: null,
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          catalogo: true,
          profesionalACargo: { select: { nombre: true } },
        },
      });

      await registrarAuditoria({
        usuarioId: auth.sesion.sub,
        accion: "ASUNTO_REABRIR",
        entidad: "Asunto",
        entidadId: id,
        detalle: {},
      });

      return NextResponse.json(actualizado);
    }

    return NextResponse.json({ error: "Accion invalida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el asunto." }, { status: 503 });
  }
}
