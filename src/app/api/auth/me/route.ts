import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesionServidor } from "@/lib/session-server";

export async function GET() {
  const sesion = await obtenerSesionServidor();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.sub },
    select: { id: true, usuario: true, nombre: true, rol: true, activo: true },
  });

  if (!usuario || !usuario.activo) {
    return NextResponse.json({ error: "Usuario no disponible." }, { status: 401 });
  }

  return NextResponse.json(usuario);
}
