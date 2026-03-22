export const ROLES = {
  SOCIO: "Socio",
  ESCRIBANO: "Escribano",
  ABOGADO: "Abogado",
  PROCURADOR: "Procurador",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];
