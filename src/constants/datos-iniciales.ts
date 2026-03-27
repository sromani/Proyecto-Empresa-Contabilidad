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
  grupo: string;
  puesto: string;
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
    grupo: "LEGAL_A_CARGO",
    puesto: "ESCRIBANO",
  },
  {
    id: "p2",
    nombre: "Martin Silva",
    profesion: "Abogado",
    funcion: "Patrocinio legal",
    grupo: "LEGAL_A_CARGO",
    puesto: "ABOGADO",
  },
  {
    id: "p3",
    nombre: "Carolina Diaz",
    profesion: "Procuradora",
    funcion: "Gestion de expedientes",
    grupo: "LEGAL_COLABORADOR",
    puesto: "PROCURADOR",
  },
];

export const SOCIOS_BASE = [
  { id: "s1", nombre: "Santiago Acosta" },
  { id: "s2", nombre: "Valeria Nunez" },
];
