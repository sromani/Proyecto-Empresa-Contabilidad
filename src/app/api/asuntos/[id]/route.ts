import { EstadoAsunto } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorValidacionEquipoAsunto } from "@/lib/asunto-equipo-validar";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import { puedeFinalizarAsunto, puedeReabrirAsunto } from "@/lib/roles-app";

type Params = { params: Promise<{ id: string }> };

function parseFechaIso(s: unknown): Date | null {
  if (s === undefined || s === null || s === "") {
    return null;
  }
  const raw = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const ahora = new Date();
    const d = new Date(`${raw}T00:00:00`);
    d.setHours(ahora.getHours(), ahora.getMinutes(), ahora.getSeconds(), 0);
    return d;
  }
  const d = new Date(raw);
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
        colaboradorACargo2: true,
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

      await prisma.seguimiento.create({
        data: {
          asuntoId: id,
          descripcion: "Asunto finalizado.",
          fecha: fechaFin,
          usuarioId: auth.sesion.sub,
        },
      });
      await prisma.asunto.update({
        where: { id },
        data: {
          ultimoMovimientoFecha: fechaFin,
          ultimoMovimientoTexto: "Asunto finalizado.",
        },
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

    if (accion === "reasignar") {
      if (!puedeFinalizarAsunto(auth.sesion.rol)) {
        return NextResponse.json(
          { error: "Solo administradores o socios pueden reasignar el equipo del asunto." },
          { status: 403 },
        );
      }
      if (actual.estado !== EstadoAsunto.EN_TRAMITE) {
        return NextResponse.json(
          { error: "Solo se puede reasignar equipo en asuntos EN TRAMITE." },
          { status: 400 },
        );
      }

      function parseOptProfFk(v: unknown): string | null {
        if (v === null || v === undefined) return null;
        const s = String(v).trim();
        return s === "" ? null : s;
      }

      const socioReferenteId =
        body?.socioReferenteId !== undefined
          ? String(body.socioReferenteId).trim()
          : actual.socioReferenteId;
      const profesionalACargoId =
        body?.profesionalACargoId !== undefined
          ? String(body.profesionalACargoId).trim()
          : actual.profesionalACargoId;
      const colaboradorACargoId =
        body?.colaboradorACargoId !== undefined
          ? parseOptProfFk(body.colaboradorACargoId)
          : actual.colaboradorACargoId;
      const colaboradorACargo2Id =
        body?.colaboradorACargo2Id !== undefined
          ? parseOptProfFk(body.colaboradorACargo2Id)
          : actual.colaboradorACargo2Id;
      const contadorReferenteId =
        body?.contadorReferenteId !== undefined
          ? parseOptProfFk(body.contadorReferenteId)
          : actual.contadorReferenteId;

      const errVal = await mensajeErrorValidacionEquipoAsunto(prisma, {
        socioReferenteId,
        profesionalACargoId,
        colaboradorACargoId,
        colaboradorACargo2Id,
        contadorReferenteId,
      });
      if (errVal) {
        return NextResponse.json({ error: errVal }, { status: 400 });
      }

      const nota = String(body?.notaSeguimiento ?? "").trim() || "Reasignacion de equipo del asunto.";

      const actualizado = await prisma.$transaction(async (tx) => {
        const upd = await tx.asunto.update({
          where: { id },
          data: {
            socioReferenteId,
            profesionalACargoId,
            colaboradorACargoId,
            colaboradorACargo2Id,
            contadorReferenteId,
            ultimoMovimientoFecha: new Date(),
            ultimoMovimientoTexto: nota,
          },
          include: {
            cliente: true,
            catalogo: true,
            socioReferente: true,
            profesionalACargo: true,
            colaboradorACargo: true,
            colaboradorACargo2: true,
            contadorReferente: true,
            seguimientos: { orderBy: { fecha: "desc" } },
          },
        });
        await tx.seguimiento.create({
          data: {
            asuntoId: id,
            descripcion: nota,
            usuarioId: auth.sesion.sub,
          },
        });
        return upd;
      });

      await registrarAuditoria({
        usuarioId: auth.sesion.sub,
        accion: "ASUNTO_REASIGNAR",
        entidad: "Asunto",
        entidadId: id,
        detalle: {
          socioReferenteId,
          profesionalACargoId,
          colaboradorACargoId,
          colaboradorACargo2Id,
          contadorReferenteId,
        },
      });

      return NextResponse.json(actualizado);
    }

    return NextResponse.json({ error: "Accion invalida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el asunto." }, { status: 503 });
  }
}
