import { RolApp } from "@/generated/prisma";

const MAPA: Record<string, RolApp> = {
  ADMIN: RolApp.ADMIN,
  USUARIO: RolApp.USUARIO,
  SOCIO: RolApp.SOCIO,
  PROFESIONAL: RolApp.PROFESIONAL,
  COLABORADOR: RolApp.COLABORADOR,
  CONTADOR: RolApp.CONTADOR,
  SOLO_LECTURA: RolApp.SOLO_LECTURA,
};

export function parseRolApp(raw: unknown, predeterminado: RolApp = RolApp.PROFESIONAL): RolApp {
  const k = String(raw ?? "")
    .trim()
    .toUpperCase();
  return MAPA[k] ?? predeterminado;
}

export function tryParseRolApp(raw: unknown): RolApp | undefined {
  const k = String(raw ?? "")
    .trim()
    .toUpperCase();
  return MAPA[k];
}
