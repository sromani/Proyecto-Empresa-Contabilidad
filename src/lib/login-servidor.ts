import bcrypt from "bcryptjs";
import { asegurarUsuarioAdminSiDbVacia } from "@/lib/bootstrap-admin";
import { prisma } from "@/lib/prisma";
import { crearTokenSesion, type RolSesion } from "@/lib/session-token";

export type LoginServidorOk = {
  tipo: "ok";
  token: string;
  usuario: string;
  nombre: string;
  rol: RolSesion;
};

export type LoginServidorErr = { tipo: "error"; mensaje: string; status: number };

export type ResultadoLoginServidor = LoginServidorOk | LoginServidorErr;

/**
 * Logica de autenticacion compartida (API Route y Server Action).
 * Todo corre en Node, sin fetch cliente → sin HTML accidental en la respuesta.
 */
export async function ejecutarLoginServidor(
  usuarioRaw: string,
  passwordRaw: string,
): Promise<ResultadoLoginServidor> {
  const usuario = usuarioRaw.trim().toLowerCase();
  const password = passwordRaw.trim();

  if (!usuario || !password) {
    return { tipo: "error", mensaje: "Usuario y clave son obligatorios.", status: 400 };
  }

  await asegurarUsuarioAdminSiDbVacia();

  let registro;
  try {
    registro = await prisma.usuario.findUnique({
      where: { usuario },
    });
  } catch (e) {
    console.error("[login] prisma", e);
    return {
      tipo: "error",
      mensaje: "No se pudo conectar a la base de datos.",
      status: 503,
    };
  }

  if (!registro || !registro.activo) {
    return {
      tipo: "error",
      mensaje:
        "Credenciales invalidas o usuario inactivo. Si es la primera vez, ejecuta: npm run prisma:seed",
      status: 401,
    };
  }

  const bcryptOk = await bcrypt.compare(password, registro.passwordHash);
  if (!bcryptOk) {
    return { tipo: "error", mensaje: "Credenciales invalidas.", status: 401 };
  }

  const rol = registro.rol as unknown as RolSesion;

  let token: string;
  try {
    token = await crearTokenSesion({
      sub: registro.id,
      usuario: registro.usuario,
      rol,
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    console.error("[login] JWT", e);
    const esProd = process.env.NODE_ENV === "production";
    return {
      tipo: "error",
      mensaje: esProd
        ? "Error al iniciar sesion. Revisa la consola del servidor."
        : `Error al iniciar sesion: ${mensaje}`,
      status: 500,
    };
  }

  return {
    tipo: "ok",
    token,
    usuario: registro.usuario,
    nombre: registro.nombre,
    rol,
  };
}
