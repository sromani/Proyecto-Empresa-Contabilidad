import { SignJWT, jwtVerify } from "jose";

/** Coincide con valores de `RolApp` en Prisma (JWT guarda string). */
export type RolSesion =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

export type PayloadSesion = {
  sub: string;
  usuario: string;
  rol: RolSesion;
};

const ROLES_VALIDOS = new Set<RolSesion>([
  "ADMIN",
  "USUARIO",
  "SOCIO",
  "PROFESIONAL",
  "COLABORADOR",
  "CONTADOR",
  "SOLO_LECTURA",
]);

/** Misma clave en todos los runtimes de desarrollo (Node + Edge/Middleware). */
const SECRETO_DESARROLLO_FIJO = "desarrollo-auth-secret-32chars!!";

function obtenerClaveSecreta(): Uint8Array {
  if (process.env.NODE_ENV === "production") {
    const secreto = process.env.AUTH_SECRET?.trim();
    if (!secreto) {
      throw new Error("Falta AUTH_SECRET en .env (minimo 32 caracteres).");
    }
    if (secreto.length < 32) {
      throw new Error("AUTH_SECRET debe tener al menos 32 caracteres en produccion.");
    }
    return new TextEncoder().encode(secreto);
  }

  return new TextEncoder().encode(SECRETO_DESARROLLO_FIJO);
}

export async function crearTokenSesion(payload: PayloadSesion): Promise<string> {
  return new SignJWT({ usuario: payload.usuario, rol: payload.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(obtenerClaveSecreta());
}

export async function verificarTokenSesion(token: string): Promise<PayloadSesion | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerClaveSecreta());
    const sub = payload.sub;
    const usuario = payload.usuario;
    const rol = payload.rol;
    if (typeof sub !== "string" || typeof usuario !== "string" || typeof rol !== "string") {
      return null;
    }
    if (!ROLES_VALIDOS.has(rol as RolSesion)) {
      return null;
    }
    return { sub, usuario, rol: rol as RolSesion };
  } catch {
    return null;
  }
}
