import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { mensajeErrorApiDbAcceso, obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const [clientes, asuntos, profesionales, socios] = await Promise.all([
      prisma.cliente.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, documento: true },
      }),
      prisma.asuntoCatalogo.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
      prisma.profesional.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, profesion: true, funcion: true, grupo: true, puesto: true },
      }),
      prisma.socio.findMany({
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, profesion: true, funcion: true },
      }),
    ]);

    return NextResponse.json({
      clientes,
      asuntos,
      profesionales,
      socios,
    });
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
  }
}
