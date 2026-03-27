import { NextResponse } from "next/server";
import { requiereApiMaestrosEstudio } from "@/lib/api-auth";
import {
  esPrismaValidacion,
  mensajeErrorApiDbAcceso,
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
      select: { id: true, nombre: true, profesion: true, funcion: true, createdAt: true },
    });
    return NextResponse.json(socios);
  } catch (e) {
    return NextResponse.json({ error: mensajeErrorApiDbAcceso(e) }, { status: 503 });
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
  const profesion = String(body?.profesion ?? "").trim();
  const funcion = String(body?.funcion ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "El nombre del socio es obligatorio." }, { status: 400 });
  }
  if (nombre.length > 500 || profesion.length > 500 || funcion.length > 500) {
    return NextResponse.json({ error: "Algun texto supera el limite permitido." }, { status: 400 });
  }

  try {
    const socio = await prisma.socio.create({
      data: { nombre, profesion, funcion },
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
