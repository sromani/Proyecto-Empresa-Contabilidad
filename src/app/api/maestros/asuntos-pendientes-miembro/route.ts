import { EstadoAsunto } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiMaestrosEstudio } from "@/lib/api-auth";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";

/**
 * Cuenta asuntos EN TRAMITE donde un socio o profesional figura en alguna asignacion.
 * Query: exactamente uno de `profesionalId` o `socioId`.
 */
export async function GET(request: Request) {
  const auth = await requiereApiMaestrosEstudio();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const profesionalId = (searchParams.get("profesionalId") ?? "").trim();
  const socioId = (searchParams.get("socioId") ?? "").trim();

  if ((!profesionalId && !socioId) || (profesionalId && socioId)) {
    return NextResponse.json(
      { error: "Indica solo profesionalId o solo socioId." },
      { status: 400 },
    );
  }

  const estado = EstadoAsunto.EN_TRAMITE;

  try {
    if (socioId) {
      const existe = await prisma.socio.findUnique({ where: { id: socioId }, select: { id: true } });
      if (!existe) {
        return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
      }
      const n = await prisma.asunto.count({
        where: { estado, socioReferenteId: socioId },
      });
      return NextResponse.json({
        total: n,
        porRol: {
          socioReferenteId: n,
          profesionalACargoId: 0,
          colaboradorACargoId: 0,
          colaboradorACargo2Id: 0,
          contadorReferenteId: 0,
        },
      });
    }

    const existe = await prisma.profesional.findUnique({
      where: { id: profesionalId },
      select: { id: true },
    });
    if (!existe) {
      return NextResponse.json({ error: "Profesional no encontrado." }, { status: 404 });
    }

    const [profesionalACargoId, colaboradorACargoId, colaboradorACargo2Id, contadorReferenteId] =
      await Promise.all([
        prisma.asunto.count({ where: { estado, profesionalACargoId: profesionalId } }),
        prisma.asunto.count({ where: { estado, colaboradorACargoId: profesionalId } }),
        prisma.asunto.count({ where: { estado, colaboradorACargo2Id: profesionalId } }),
        prisma.asunto.count({ where: { estado, contadorReferenteId: profesionalId } }),
      ]);

    const total = await prisma.asunto.count({
      where: {
        estado,
        OR: [
          { profesionalACargoId: profesionalId },
          { colaboradorACargoId: profesionalId },
          { colaboradorACargo2Id: profesionalId },
          { contadorReferenteId: profesionalId },
        ],
      },
    });

    return NextResponse.json({
      total,
      porRol: {
        profesionalACargoId,
        colaboradorACargoId,
        colaboradorACargo2Id,
        contadorReferenteId,
        socioReferenteId: 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar asuntos pendientes." }, { status: 503 });
  }
}
