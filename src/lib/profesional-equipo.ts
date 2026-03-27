import { GrupoProfesional, PuestoProfesional } from "@/generated/prisma";

export { ETIQUETA_GRUPO, ETIQUETA_PUESTO } from "./profesional-equipo-catalogo";
import { grupoDesdePuesto, type PuestoCatalogo } from "./profesional-equipo-catalogo";

export const PUESTOS_POR_GRUPO: Record<GrupoProfesional, readonly PuestoProfesional[]> = {
  DIRECCION: [PuestoProfesional.DIRECTOR, PuestoProfesional.GERENTE],
  LEGAL_A_CARGO: [PuestoProfesional.ESCRIBANO, PuestoProfesional.ABOGADO],
  LEGAL_COLABORADOR: [
    PuestoProfesional.PROCURADOR,
    PuestoProfesional.ESTUDIANTE,
    PuestoProfesional.ADMINISTRATIVO,
  ],
  CONTADOR: [PuestoProfesional.CONTADOR],
};

const GRUPOS = new Set<string>(Object.values(GrupoProfesional));
const PUESTOS = new Set<string>(Object.values(PuestoProfesional));

export function parseGrupoProfesional(raw: string): GrupoProfesional | null {
  const u = raw.trim().toUpperCase();
  return GRUPOS.has(u) ? (u as GrupoProfesional) : null;
}

export function parsePuestoProfesional(raw: string): PuestoProfesional | null {
  const u = raw.trim().toUpperCase();
  return PUESTOS.has(u) ? (u as PuestoProfesional) : null;
}

export function puestoValidoEnGrupo(grupo: GrupoProfesional, puesto: PuestoProfesional): boolean {
  return (PUESTOS_POR_GRUPO[grupo] as readonly PuestoProfesional[]).includes(puesto);
}

/** Dirección: solo nombre + puesto; el resto exige función en el estudio. */
export function requiereFuncionEnEstudio(grupo: GrupoProfesional): boolean {
  return grupo !== GrupoProfesional.DIRECCION;
}

const MAP_GRUPO: Record<string, GrupoProfesional> = {
  DIRECCION: GrupoProfesional.DIRECCION,
  LEGAL_A_CARGO: GrupoProfesional.LEGAL_A_CARGO,
  LEGAL_COLABORADOR: GrupoProfesional.LEGAL_COLABORADOR,
  CONTADOR: GrupoProfesional.CONTADOR,
};

export function grupoProfesionalDesdePuesto(puesto: PuestoProfesional): GrupoProfesional {
  return MAP_GRUPO[grupoDesdePuesto(puesto as PuestoCatalogo)];
}

/**
 * Resuelve grupo + puesto desde el body: acepta `rol` o `puesto` como cargo único,
 * o la pareja `grupo` + `puesto` (compatibilidad).
 */
export function resolverGrupoPuestoDesdeBody(body: Record<string, unknown>): {
  grupo: GrupoProfesional;
  puesto: PuestoProfesional;
} | null {
  const puestoSolo = parsePuestoProfesional(String(body?.rol ?? body?.puesto ?? ""));
  if (puestoSolo) {
    return {
      puesto: puestoSolo,
      grupo: grupoProfesionalDesdePuesto(puestoSolo),
    };
  }
  const g = parseGrupoProfesional(String(body?.grupo ?? ""));
  const p = parsePuestoProfesional(String(body?.puesto ?? ""));
  if (g && p && puestoValidoEnGrupo(g, p)) {
    return { grupo: g, puesto: p };
  }
  return null;
}
