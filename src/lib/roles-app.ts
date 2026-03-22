import type { RolApp } from "@/generated/prisma";
import type { RolSesion } from "@/lib/session-token";

const ROLES_SESION: RolSesion[] = [
  "ADMIN",
  "USUARIO",
  "SOCIO",
  "PROFESIONAL",
  "COLABORADOR",
  "CONTADOR",
  "SOLO_LECTURA",
];

export function esRolSesionValido(rol: unknown): rol is RolSesion {
  return typeof rol === "string" && (ROLES_SESION as string[]).includes(rol);
}

export function rolAppDesdeSesion(rol: RolSesion): RolApp {
  return rol as unknown as RolApp;
}

/** Administrador de la aplicacion */
export function esAdministrador(rol: RolSesion): boolean {
  return rol === "ADMIN";
}

/** Alta de socios y profesionales (catalogo del estudio) */
export function puedeGestionarMaestrosEstudio(rol: RolSesion): boolean {
  return rol === "ADMIN" || rol === "SOCIO";
}

/** Puede finalizar asuntos (RF: Socio o Administrador) */
export function puedeFinalizarAsunto(rol: RolSesion): boolean {
  return rol === "ADMIN" || rol === "SOCIO";
}

/** Puede reabrir asunto FINALIZADO (solo admin por RF) */
export function puedeReabrirAsunto(rol: RolSesion): boolean {
  return rol === "ADMIN";
}

/** Puede registrar movimientos (profesional, colaborador, socio, admin) */
export function puedeRegistrarMovimiento(rol: RolSesion): boolean {
  return (
    rol === "ADMIN" ||
    rol === "SOCIO" ||
    rol === "PROFESIONAL" ||
    rol === "COLABORADOR" ||
    rol === "USUARIO"
  );
}

/** Solo lectura o contador referente: sin edicion de movimientos (contador se refina con asignacion) */
export function esSoloLectura(rol: RolSesion): boolean {
  return rol === "SOLO_LECTURA";
}
