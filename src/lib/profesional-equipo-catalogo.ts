/**
 * Catálogo de grupo/puesto sin importar Prisma: seguro para "use client".
 * Debe coincidir con GrupoProfesional / PuestoProfesional en schema.prisma.
 */
export type GrupoCatalogo = "DIRECCION" | "LEGAL_A_CARGO" | "LEGAL_COLABORADOR" | "CONTADOR";

export type PuestoCatalogo =
  | "DIRECTOR"
  | "GERENTE"
  | "ESCRIBANO"
  | "ABOGADO"
  | "PROCURADOR"
  | "ESTUDIANTE"
  | "ADMINISTRATIVO"
  | "CONTADOR";

export const PUESTOS_POR_GRUPO: Record<GrupoCatalogo, readonly PuestoCatalogo[]> = {
  DIRECCION: ["DIRECTOR", "GERENTE"],
  LEGAL_A_CARGO: ["ESCRIBANO", "ABOGADO"],
  LEGAL_COLABORADOR: ["PROCURADOR", "ESTUDIANTE", "ADMINISTRATIVO"],
  CONTADOR: ["CONTADOR"],
};

export const ETIQUETA_GRUPO: Record<GrupoCatalogo, string> = {
  DIRECCION: "Equipo de dirección",
  LEGAL_A_CARGO: "Profesional a cargo (legal/notarial)",
  LEGAL_COLABORADOR: "Colaborador (legal/notarial)",
  CONTADOR: "Contador",
};

export const ETIQUETA_PUESTO: Record<PuestoCatalogo, string> = {
  DIRECTOR: "Director",
  GERENTE: "Gerente",
  ESCRIBANO: "Escribano",
  ABOGADO: "Abogado",
  PROCURADOR: "Procurador",
  ESTUDIANTE: "Estudiante",
  ADMINISTRATIVO: "Administrativo",
  CONTADOR: "Contador",
};

/** Un solo "rol" (puesto) determina el bloque interno (grupo). */
export const GRUPO_POR_PUESTO: Record<PuestoCatalogo, GrupoCatalogo> = {
  DIRECTOR: "DIRECCION",
  GERENTE: "DIRECCION",
  ESCRIBANO: "LEGAL_A_CARGO",
  ABOGADO: "LEGAL_A_CARGO",
  PROCURADOR: "LEGAL_COLABORADOR",
  ESTUDIANTE: "LEGAL_COLABORADOR",
  ADMINISTRATIVO: "LEGAL_COLABORADOR",
  CONTADOR: "CONTADOR",
};

/** Orden del desplegable único de roles en alta de equipo. */
export const PUESTOS_EQUIPO_ORDEN: readonly PuestoCatalogo[] = [
  "DIRECTOR",
  "GERENTE",
  "ESCRIBANO",
  "ABOGADO",
  "PROCURADOR",
  "ESTUDIANTE",
  "ADMINISTRATIVO",
  "CONTADOR",
];

export function grupoDesdePuesto(p: PuestoCatalogo): GrupoCatalogo {
  return GRUPO_POR_PUESTO[p];
}

/** Dirección: función opcional; el resto la suelen completar en maestros. */
export function puestoRequiereFuncionEnEstudio(p: PuestoCatalogo): boolean {
  return p !== "DIRECTOR" && p !== "GERENTE";
}
