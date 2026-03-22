import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { RolApp } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { parseRolApp } from "@/lib/rol-app-util";
import { obtenerSesionServidor } from "@/lib/session-server";

async function verificarAdmin() {
  const sesion = await obtenerSesionServidor();
  if (!sesion || sesion.rol !== "ADMIN") {
    return null;
  }
  return sesion;
}

export async function GET() {
  const admin = await verificarAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const lista = await prisma.usuario.findMany({
    orderBy: { usuario: "asc" },
    select: {
      id: true,
      usuario: true,
      nombre: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(lista);
}

export async function POST(request: Request) {
  const admin = await verificarAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const usuario = String(body?.usuario ?? "").trim().toLowerCase();
    const nombre = String(body?.nombre ?? "").trim();
    const password = String(body?.password ?? "");
    const rol = parseRolApp(body?.rol, RolApp.PROFESIONAL);

    if (!usuario || usuario.length < 2) {
      return NextResponse.json({ error: "Usuario invalido (minimo 2 caracteres)." }, { status: 400 });
    }
    if (!nombre) {
      return NextResponse.json({ error: "Nombre obligatorio." }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Clave obligatoria (minimo 4 caracteres)." }, { status: 400 });
    }

    const existe = await prisma.usuario.findUnique({ where: { usuario } });
    if (existe) {
      return NextResponse.json({ error: "Ese usuario ya existe." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const creado = await prisma.usuario.create({
      data: {
        usuario,
        nombre,
        passwordHash,
        rol,
        activo: true,
      },
      select: {
        id: true,
        usuario: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(creado, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
  }
}
