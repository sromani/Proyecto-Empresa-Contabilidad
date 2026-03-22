import { EstadoAsunto, Prisma, TipoAsunto } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";

const TIPOS: TipoAsunto[] = [TipoAsunto.TODOS, TipoAsunto.NOTARIAL, TipoAsunto.LEGAL];

function parseFechaIso(s: unknown): Date | null {
  if (s === undefined || s === null || s === "") {
    return null;
  }
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Listado RF-07 (basico): filtros por querystring */
export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estadoQ = searchParams.get("estado");
    const tipoQ = searchParams.get("tipo");
    const q = (searchParams.get("q") ?? "").trim();

    const where: Prisma.AsuntoWhereInput = {};

    if (estadoQ === "EN_TRAMITE" || estadoQ === "FINALIZADO") {
      where.estado = estadoQ as EstadoAsunto;
    }

    if (tipoQ === "TODOS" || tipoQ === "NOTARIAL" || tipoQ === "LEGAL") {
      where.tipo = tipoQ as TipoAsunto;
    }

    if (q) {
      where.OR = [
        { descripcion: { contains: q, mode: "insensitive" } },
        { ultimoMovimientoTexto: { contains: q, mode: "insensitive" } },
        { cliente: { nombre: { contains: q, mode: "insensitive" } } },
        { cliente: { documento: { contains: q, mode: "insensitive" } } },
        { catalogo: { nombre: { contains: q, mode: "insensitive" } } },
      ];
    }

    const lista = await prisma.asunto.findMany({
      where,
      orderBy: [{ ordinal: "desc" }],
      take: 500,
      select: {
        id: true,
        ordinal: true,
        tipo: true,
        estado: true,
        fechaInicio: true,
        fechaAlertaVencimiento: true,
        fechaFinalizacion: true,
        ultimoMovimientoFecha: true,
        ultimoMovimientoTexto: true,
        descripcion: true,
        cliente: { select: { id: true, nombre: true, documento: true } },
        catalogo: { select: { nombre: true } },
        socioReferente: { select: { nombre: true } },
        profesionalACargo: { select: { nombre: true } },
      },
    });

    return NextResponse.json(lista);
  } catch {
    return NextResponse.json(
      { error: "No se pudo listar asuntos. Revisa la base de datos." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const body = await request.json();

    const tipoRaw = String(body?.tipo ?? "");
    const tipo = TIPOS.includes(tipoRaw as TipoAsunto) ? (tipoRaw as TipoAsunto) : null;
    const clienteId = String(body?.clienteId ?? "");
    const asuntoNombre = String(body?.asuntoNombre ?? "").trim();
    const profesionalACargoId = String(body?.profesionalACargoId ?? "");
    const colaboradorACargoId = String(body?.colaboradorACargoId ?? "").trim() || null;
    const contadorReferenteId = String(body?.contadorReferenteId ?? "").trim() || null;
    const socioReferenteId = String(body?.socioReferenteId ?? "");
    const seguimientoInicial = String(body?.seguimientoInicial ?? "").trim();
    const descripcionLibre = String(body?.descripcion ?? "").trim() || null;
    const fechaInicio = parseFechaIso(body?.fechaInicio) ?? new Date();
    const fechaAlerta = parseFechaIso(body?.fechaAlertaVencimiento);

    if (!tipo) {
      return NextResponse.json({ error: "Tipo de asunto invalido (TODOS, LEGAL o NOTARIAL)." }, { status: 400 });
    }

    if (!clienteId || !asuntoNombre || !socioReferenteId || !seguimientoInicial) {
      return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    if (!profesionalACargoId) {
      return NextResponse.json({ error: "Debes indicar el profesional a cargo." }, { status: 400 });
    }

    if (fechaAlerta && fechaAlerta < fechaInicio) {
      return NextResponse.json(
        { error: "La alerta de vencimiento no puede ser anterior a la fecha de inicio." },
        { status: 400 },
      );
    }

    const asunto = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const catalogo = await tx.asuntoCatalogo.upsert({
        where: { nombre: asuntoNombre },
        update: {},
        create: { nombre: asuntoNombre },
      });

      const creado = await tx.asunto.create({
        data: {
          tipo,
          descripcion: descripcionLibre,
          clienteId,
          catalogoId: catalogo.id,
          socioReferenteId,
          profesionalACargoId,
          colaboradorACargoId,
          contadorReferenteId,
          estado: EstadoAsunto.EN_TRAMITE,
          fechaInicio,
          fechaAlertaVencimiento: fechaAlerta,
          seguimientos: {
            create: {
              descripcion: seguimientoInicial,
              usuarioId: auth.sesion.sub,
              fecha: new Date(),
            },
          },
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          catalogo: true,
          socioReferente: { select: { id: true, nombre: true } },
          profesionalACargo: { select: { id: true, nombre: true, rol: true } },
          colaboradorACargo: { select: { id: true, nombre: true } },
          contadorReferente: { select: { id: true, nombre: true } },
          seguimientos: { orderBy: { fecha: "desc" }, take: 1 },
        },
      });

      const ult = creado.seguimientos[0];
      await tx.asunto.update({
        where: { id: creado.id },
        data: {
          ultimoMovimientoFecha: ult?.fecha ?? new Date(),
          ultimoMovimientoTexto: ult?.descripcion.slice(0, 500) ?? seguimientoInicial.slice(0, 500),
        },
      });

      return tx.asunto.findUniqueOrThrow({
        where: { id: creado.id },
        include: {
          cliente: { select: { id: true, nombre: true } },
          catalogo: true,
          socioReferente: { select: { id: true, nombre: true } },
          profesionalACargo: { select: { id: true, nombre: true, rol: true } },
          colaboradorACargo: { select: { id: true, nombre: true } },
          contadorReferente: { select: { id: true, nombre: true } },
          seguimientos: { orderBy: { fecha: "desc" } },
        },
      });
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "ASUNTO_CREAR",
      entidad: "Asunto",
      entidadId: asunto.id,
      detalle: { ordinal: asunto.ordinal, tipo: asunto.tipo },
    });

    return NextResponse.json(asunto, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Cliente, profesionales o socio no existen." },
        { status: 400 },
      );
    }
    console.error("[asuntos POST]", error);
    return NextResponse.json(
      { error: "No se pudo crear el asunto. Revisa conexion con PostgreSQL." },
      { status: 503 },
    );
  }
}
