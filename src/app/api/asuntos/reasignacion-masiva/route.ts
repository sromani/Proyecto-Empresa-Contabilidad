import { EstadoAsunto, GrupoProfesional } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import { puedeFinalizarAsunto } from "@/lib/roles-app";

const CAMPOS_REASIGNACION = [
  "profesionalACargoId",
  "colaboradorACargoId",
  "colaboradorACargo2Id",
  "contadorReferenteId",
  "socioReferenteId",
] as const;

type CampoReasignacion = (typeof CAMPOS_REASIGNACION)[number];

function idsEquipoEnAsunto(row: {
  profesionalACargoId: string;
  colaboradorACargoId: string | null;
  colaboradorACargo2Id: string | null;
  contadorReferenteId: string | null;
}): string[] {
  return [
    row.profesionalACargoId,
    row.colaboradorACargoId,
    row.colaboradorACargo2Id,
    row.contadorReferenteId,
  ].filter((x): x is string => Boolean(x));
}

function hayDuplicadosEquipo(
  row: {
    profesionalACargoId: string;
    colaboradorACargoId: string | null;
    colaboradorACargo2Id: string | null;
    contadorReferenteId: string | null;
  },
  campo: CampoReasignacion,
  haciaId: string,
): boolean {
  const next =
    campo === "socioReferenteId"
      ? row
      : { ...row, [campo]: haciaId };
  const ids = idsEquipoEnAsunto(next);
  return new Set(ids).size !== ids.length;
}

export async function POST(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  if (!puedeFinalizarAsunto(auth.sesion.rol)) {
    return NextResponse.json(
      { error: "Solo administradores o socios pueden ejecutar reasignaciones masivas." },
      { status: 403 },
    );
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido." }, { status: 400 });
  }

  const campo = String(body?.campo ?? "") as CampoReasignacion;
  if (!CAMPOS_REASIGNACION.includes(campo)) {
    return NextResponse.json(
      {
        error:
          "Campo invalido. Use profesionalACargoId, colaboradorACargoId, colaboradorACargo2Id, contadorReferenteId o socioReferenteId.",
      },
      { status: 400 },
    );
  }

  const desdeId = String(body?.desdeId ?? "").trim();
  const haciaId = String(body?.haciaId ?? "").trim();
  if (!desdeId || !haciaId) {
    return NextResponse.json({ error: "Indica la persona que deja y el reemplazo." }, { status: 400 });
  }
  if (desdeId === haciaId) {
    return NextResponse.json({ error: "El reemplazo debe ser distinto." }, { status: 400 });
  }

  if (campo === "socioReferenteId") {
    const ok = await prisma.socio.findUnique({ where: { id: haciaId }, select: { id: true } });
    if (!ok) {
      return NextResponse.json({ error: "El nuevo socio no existe en maestros." }, { status: 400 });
    }
  } else {
    const grupoEsperado =
      campo === "profesionalACargoId"
        ? GrupoProfesional.LEGAL_A_CARGO
        : campo === "contadorReferenteId"
          ? GrupoProfesional.CONTADOR
          : GrupoProfesional.LEGAL_COLABORADOR;
    const prof = await prisma.profesional.findUnique({
      where: { id: haciaId },
      select: { grupo: true },
    });
    if (!prof || prof.grupo !== grupoEsperado) {
      return NextResponse.json(
        {
          error:
            "El reemplazo no tiene el rol adecuado para ese puesto (a cargo legal, colaborador o contador).",
        },
        { status: 400 },
      );
    }
  }

  const where = {
    estado: EstadoAsunto.EN_TRAMITE,
    [campo]: desdeId,
  } as const;

  const candidatos = await prisma.asunto.findMany({
    where,
    select: {
      id: true,
      ordinal: true,
      profesionalACargoId: true,
      colaboradorACargoId: true,
      colaboradorACargo2Id: true,
      contadorReferenteId: true,
    },
  });

  if (candidatos.length === 0) {
    return NextResponse.json({
      ok: true,
      actualizados: 0,
      mensaje: "No hay asuntos EN TRAMITE con esa asignacion.",
    });
  }

  if (campo !== "socioReferenteId") {
    for (const row of candidatos) {
      if (hayDuplicadosEquipo(row, campo, haciaId)) {
        return NextResponse.json(
          {
            error: `No se puede reasignar: en el asunto ordinal ${row.ordinal} el reemplazo ya figura en otro rol del mismo equipo.`,
          },
          { status: 400 },
        );
      }
    }
  }

  const desc =
    String(body?.descripcionSeguimiento ?? "").trim() ||
    "Reasignacion masiva: cambio de responsable (baja o cambio en el departamento).";

  await prisma.$transaction(async (tx) => {
    await tx.asunto.updateMany({
      where: { id: { in: candidatos.map((a) => a.id) } },
      data: {
        [campo]: haciaId,
        ultimoMovimientoFecha: new Date(),
        ultimoMovimientoTexto: desc,
      },
    });
    await tx.seguimiento.createMany({
      data: candidatos.map((a) => ({
        asuntoId: a.id,
        descripcion: desc,
        usuarioId: auth.sesion.sub,
      })),
    });
  });

  await registrarAuditoria({
    usuarioId: auth.sesion.sub,
    accion: "ASUNTO_REASIGNAR_MASIVO",
    entidad: "Asunto",
    detalle: {
      campo,
      desdeId,
      haciaId,
      cantidad: candidatos.length,
      ordinalesMuestra: candidatos.map((a) => a.ordinal).slice(0, 80),
    },
  });

  return NextResponse.json({
    ok: true,
    actualizados: candidatos.length,
    mensaje: `Se actualizaron ${candidatos.length} asunto(s) EN TRAMITE.`,
  });
}
