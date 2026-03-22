import bcrypt from "bcryptjs";
import { RolApp } from "@/generated/prisma";
import { CLAVE_ADMIN_INICIAL } from "@/lib/auth-inicial";
import { prisma } from "@/lib/prisma";

/**
 * En desarrollo: si no hay ningun usuario, crea admin con clave inicial (ver auth-inicial).
 * En produccion no hace nada (usar migraciones + seed).
 */
export async function asegurarUsuarioAdminSiDbVacia(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  try {
    const total = await prisma.usuario.count();
    if (total > 0) {
      return;
    }
    const passwordHash = await bcrypt.hash(CLAVE_ADMIN_INICIAL, 10);
    await prisma.usuario.create({
      data: {
        usuario: "admin",
        nombre: "Administrador",
        passwordHash,
        rol: RolApp.ADMIN,
        activo: true,
      },
    });
  } catch {
    // Tabla inexistente o DB desconectada: el login mostrara el error correspondiente.
  }
}
