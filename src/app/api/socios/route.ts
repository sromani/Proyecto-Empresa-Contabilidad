import { NextResponse } from "next/server";
import { requiereApiMaestrosEstudio } from "@/lib/api-auth";
import {
  esPrismaValidacion,
  mensajeErrorDesarrollo,
  mensajeErrorPrismaParaUsuario,
  obtenerErrorConfiguracionDb,
} from "@/lib/api-db";
import { registrarAuditoria } from "@/lib/auditoria";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requiereApiMaestrosEstudio();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  try {
    const socios = await prisma.socio.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, createdAt: true },
    });
    return NextResponse.json(socios);
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar a PostgreSQL. Revisa DATABASE_URL y el servidor de base." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requiereApiMaestrosEstudio();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido." }, { status: 400 });
  }

  const nombre = String(body?.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "El nombre del socio es obligatorio." }, { status: 400 });
  }
  if (nombre.length > 500) {
    return NextResponse.json({ error: "El nombre es demasiado largo." }, { status: 400 });
  }

  try {
    const socio = await prisma.socio.create({
      data: { nombre },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "SOCIO_CREAR",
      entidad: "Socio",
      entidadId: socio.id,
      detalle: { nombre: socio.nombre },
    });

    return NextResponse.json(socio, { status: 201 });
  } catch (error) {
    console.error("[api/socios POST]", error);
    if (esPrismaValidacion(error)) {
      return NextResponse.json(
        { error: `Datos invalidos: ${error.message.split("\n")[0] ?? error.message}` },
        { status: 400 },
      );
    }
    const detalle = mensajeErrorPrismaParaUsuario(error);
    const extraDev = mensajeErrorDesarrollo(error);
    return NextResponse.json(
      {
        error:
          detalle ??
          extraDev ??
          "No se pudo crear el socio. Revisa la terminal del servidor (mensaje [api/socios POST]).",
      },
      { status: 503 },
    );
  }
}
