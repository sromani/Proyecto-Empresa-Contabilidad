import { RolProfesional } from "@/generated/prisma";
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

const ROLES_PROFESIONAL = new Set<string>(Object.values(RolProfesional));

function parseRolProfesional(raw: string): RolProfesional | null {
  const u = raw.trim().toUpperCase();
  return ROLES_PROFESIONAL.has(u) ? (u as RolProfesional) : null;
}

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
        rol: true,
        createdAt: true,
      },
    });
    return NextResponse.json(profesionales);
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
  const profesion = String(body?.profesion ?? "").trim();
  const funcion = String(body?.funcion ?? "").trim();
  const rol = parseRolProfesional(String(body?.rol ?? ""));

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!profesion) {
    return NextResponse.json({ error: "La profesion es obligatoria." }, { status: 400 });
  }
  if (!funcion) {
    return NextResponse.json({ error: "La funcion es obligatoria." }, { status: 400 });
  }
  if (!rol) {
    return NextResponse.json(
      {
        error:
          "Rol invalido. Use uno de: SOCIO, ESCRIBANO, ABOGADO, PROCURADOR, CONTADOR.",
      },
      { status: 400 },
    );
  }

  const max = 500;
  if (nombre.length > max || profesion.length > max || funcion.length > max) {
    return NextResponse.json({ error: "Algun texto supera el limite permitido." }, { status: 400 });
  }

  try {
    const profesional = await prisma.profesional.create({
      data: { nombre, profesion, funcion, rol },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PROFESIONAL_CREAR",
      entidad: "Profesional",
      entidadId: profesional.id,
      detalle: { nombre: profesional.nombre, rol: profesional.rol },
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
          "No se pudo crear el profesional. Revisa la terminal del servidor (mensaje [api/profesionales POST]).",
      },
      { status: 503 },
    );
  }
}
