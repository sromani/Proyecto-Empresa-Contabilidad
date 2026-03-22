import { ROLES, Rol } from "@/constants/roles";

export type Cliente = {
  id: string;
  nombre: string;
  documento: string;
};

export type Profesional = {
  id: string;
  nombre: string;
  profesion: string;
  funcion: string;
  rol: Rol;
};

export const ASUNTOS_BASE = ["Compraventa", "Sucesion", "Arrendamiento"];

export const CLIENTES_BASE: Cliente[] = [
  { id: "c1", nombre: "Maria Perez", documento: "212345670019" },
  { id: "c2", nombre: "Jose Rodriguez", documento: "34567890" },
];

export const PROFESIONALES_BASE: Profesional[] = [
  {
    id: "p1",
    nombre: "Lucia Fernandez",
    profesion: "Escribana",
    funcion: "Responsable de protocolos",
    rol: ROLES.ESCRIBANO,
  },
  {
    id: "p2",
    nombre: "Martin Silva",
    profesion: "Abogado",
    funcion: "Patrocinio legal",
    rol: ROLES.ABOGADO,
  },
  {
    id: "p3",
    nombre: "Carolina Diaz",
    profesion: "Procuradora",
    funcion: "Gestion de expedientes",
    rol: ROLES.PROCURADOR,
  },
];

export const SOCIOS_BASE = [
  { id: "s1", nombre: "Santiago Acosta" },
  { id: "s2", nombre: "Valeria Nunez" },
];
