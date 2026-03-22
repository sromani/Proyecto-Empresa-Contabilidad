import { EstadoAsunto } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import { esSoloLectura, puedeRegistrarMovimiento } from "@/lib/roles-app";

type Params = { params: Promise<{ id: string }> };

function parseFechaMov(s: unknown): Date {
  if (s === undefined || s === null || s === "") {
    return new Date();
  }
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function POST(request: Request, context: Params) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  if (esSoloLectura(auth.sesion.rol) || !puedeRegistrarMovimiento(auth.sesion.rol)) {
    return NextResponse.json({ error: "No autorizado a registrar movimientos." }, { status: 403 });
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id: asuntoId } = await context.params;

  try {
    const body = await request.json();
    const descripcion = String(body?.descripcion ?? "").trim();
    const fecha = parseFechaMov(body?.fecha);

    if (!descripcion) {
      return NextResponse.json({ error: "La descripcion del movimiento es obligatoria." }, { status: 400 });
    }

    const asunto = await prisma.asunto.findUnique({ where: { id: asuntoId } });
    if (!asunto) {
      return NextResponse.json({ error: "Asunto no encontrado." }, { status: 404 });
    }
    if (asunto.estado !== EstadoAsunto.EN_TRAMITE) {
      return NextResponse.json(
        { error: "No se pueden registrar movimientos en asuntos FINALIZADOS." },
        { status: 400 },
      );
    }

    const mov = await prisma.$transaction(async (tx) => {
      const creado = await tx.seguimiento.create({
        data: {
          asuntoId,
          descripcion,
          fecha,
          usuarioId: auth.sesion.sub,
        },
      });

      await tx.asunto.update({
        where: { id: asuntoId },
        data: {
          ultimoMovimientoFecha: fecha,
          ultimoMovimientoTexto: descripcion.slice(0, 500),
        },
      });

      return creado;
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "MOVIMIENTO_CREAR",
      entidad: "Seguimiento",
      entidadId: mov.id,
      detalle: { asuntoId },
    });

    return NextResponse.json(mov, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el movimiento." }, { status: 503 });
  }
}
