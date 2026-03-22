import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { RolApp } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { tryParseRolApp } from "@/lib/rol-app-util";
import { obtenerSesionServidor } from "@/lib/session-server";

type Params = { params: Promise<{ id: string }> };

async function verificarAdmin() {
  const sesion = await obtenerSesionServidor();
  if (!sesion || sesion.rol !== "ADMIN") {
    return null;
  }
  return sesion;
}

export async function PATCH(request: Request, context: Params) {
  const admin = await verificarAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const nombre = body?.nombre !== undefined ? String(body.nombre).trim() : undefined;
    const activo = typeof body?.activo === "boolean" ? body.activo : undefined;
    const password = body?.password !== undefined ? String(body.password) : undefined;
    let rol: RolApp | undefined;
    if (body?.rol !== undefined) {
      const parsed = tryParseRolApp(body.rol);
      if (!parsed) {
        return NextResponse.json({ error: "Rol invalido." }, { status: 400 });
      }
      rol = parsed;
    }

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    if (existente.id === admin.sub && activo === false) {
      return NextResponse.json({ error: "No podes desactivar tu propia cuenta." }, { status: 400 });
    }

    if (existente.id === admin.sub && rol === RolApp.USUARIO) {
      return NextResponse.json({ error: "No podes quitarte el rol de administrador." }, { status: 400 });
    }

    const data: {
      nombre?: string;
      activo?: boolean;
      rol?: RolApp;
      passwordHash?: string;
    } = {};

    if (nombre !== undefined) {
      if (!nombre) {
        return NextResponse.json({ error: "Nombre invalido." }, { status: 400 });
      }
      data.nombre = nombre;
    }
    if (activo !== undefined) {
      data.activo = activo;
    }
    if (rol !== undefined) {
      data.rol = rol;
    }
    if (password !== undefined && password !== "") {
      if (password.length < 4) {
        return NextResponse.json({ error: "Clave minimo 4 caracteres." }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios." }, { status: 400 });
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        usuario: true,
        nombre: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(actualizado);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el usuario." }, { status: 500 });
  }
}
