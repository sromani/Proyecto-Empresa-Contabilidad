import { GrupoProfesional } from "@/generated/prisma";
import type { PrismaClient } from "@/generated/prisma";

export type EquipoAsuntoIds = {
  socioReferenteId: string;
  profesionalACargoId: string;
  colaboradorACargoId: string | null;
  colaboradorACargo2Id: string | null;
  contadorReferenteId: string | null;
};

/**
 * Valida socio + profesionales (grupos y duplicados). Sin contar socios totales en BD (solo alta inicial).
 */
export async function mensajeErrorValidacionEquipoAsunto(
  prisma: PrismaClient,
  p: EquipoAsuntoIds,
): Promise<string | null> {
  const idsEquipo = [
    p.profesionalACargoId,
    p.colaboradorACargoId,
    p.colaboradorACargo2Id,
    p.contadorReferenteId,
  ].filter((x): x is string => Boolean(x));
  if (new Set(idsEquipo).size !== idsEquipo.length) {
    return "No puede repetirse la misma persona en equipo a cargo, colaboradores o contador referente.";
  }

  const socioReferenteRow = await prisma.socio.findUnique({
    where: { id: p.socioReferenteId },
    select: { id: true },
  });
  if (!socioReferenteRow) {
    return "El socio referente no existe o fue eliminado. Elegi uno valido en maestros.";
  }

  const idsCarga = [p.profesionalACargoId, p.colaboradorACargoId, p.colaboradorACargo2Id].filter(
    Boolean,
  ) as string[];
  const filasEquipo = await prisma.profesional.findMany({
    where: { id: { in: idsCarga } },
    select: { id: true, grupo: true },
  });
  if (filasEquipo.length !== idsCarga.length) {
    return "Alguno de los profesionales indicados no existe.";
  }
  const principal = filasEquipo.find((r) => r.id === p.profesionalACargoId);
  if (!principal || principal.grupo !== GrupoProfesional.LEGAL_A_CARGO) {
    return "El equipo a cargo debe ser un profesional legal a cargo (escribano o abogado) en maestros.";
  }
  for (const cid of [p.colaboradorACargoId, p.colaboradorACargo2Id]) {
    if (!cid) continue;
    const row = filasEquipo.find((r) => r.id === cid);
    if (!row || row.grupo !== GrupoProfesional.LEGAL_COLABORADOR) {
      return "Los colaboradores deben ser procurador, estudiante o administrativo segun maestros.";
    }
  }
  if (p.contadorReferenteId) {
    const cont = await prisma.profesional.findUnique({
      where: { id: p.contadorReferenteId },
      select: { grupo: true },
    });
    if (!cont || cont.grupo !== GrupoProfesional.CONTADOR) {
      return "El contador referente debe ser un miembro del equipo dado de alta como contador (maestros).";
    }
  }
  return null;
}
