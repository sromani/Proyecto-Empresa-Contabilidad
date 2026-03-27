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
import { requiereFuncionEnEstudio, resolverGrupoPuestoDesdeBody } from "@/lib/profesional-equipo";

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
    const profesionales = await prisma.profesional.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        profesion: true,
        funcion: true,
        grupo: true,
        puesto: true,
        createdAt: true,
      },
    });
    return NextResponse.json(profesionales);
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
  const resuelto = resolverGrupoPuestoDesdeBody(body);

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!resuelto) {
    return NextResponse.json(
      { error: "Indica el rol del miembro (ej. director, escribano, abogado) o grupo y puesto validos." },
      { status: 400 },
    );
  }
  const { grupo, puesto } = resuelto;
  if (requiereFuncionEnEstudio(grupo) && !funcion) {
    return NextResponse.json(
      { error: "La funcion en el estudio es obligatoria para este tipo de miembro." },
      { status: 400 },
    );
  }

  const max = 500;
  if (nombre.length > max || profesion.length > max || funcion.length > max) {
    return NextResponse.json({ error: "Algun texto supera el limite permitido." }, { status: 400 });
  }

  try {
    const profesional = await prisma.profesional.create({
      data: {
        nombre,
        profesion,
        funcion,
        grupo,
        puesto,
      },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PROFESIONAL_CREAR",
      entidad: "Profesional",
      entidadId: profesional.id,
      detalle: { nombre: profesional.nombre, grupo: profesional.grupo, puesto: profesional.puesto },
    });

    return NextResponse.json(profesional, { status: 201 });
  } catch (error) {
    console.error("[api/profesionales POST]", error);
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
          "No se pudo dar de alta al miembro del equipo. Revisa la terminal del servidor (mensaje [api/profesionales POST]).",
      },
      { status: 503 },
    );
  }
}
