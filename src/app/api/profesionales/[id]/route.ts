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

function esP2003(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2003"
  );
}

function esP2025(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requiereApiMaestrosEstudio();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Identificador invalido." }, { status: 400 });
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
          "Rol invalido. Use uno de: SOCIO, ESCRIBANO, ABOGADO, PROCURADOR.",
      },
      { status: 400 },
    );
  }

  const max = 500;
  if (nombre.length > max || profesion.length > max || funcion.length > max) {
    return NextResponse.json({ error: "Algun texto supera el limite permitido." }, { status: 400 });
  }

  try {
    const anterior = await prisma.profesional.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: "Profesional no encontrado." }, { status: 404 });
    }

    const profesional = await prisma.profesional.update({
      where: { id },
      data: { nombre, profesion, funcion, rol },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PROFESIONAL_EDITAR",
      entidad: "Profesional",
      entidadId: profesional.id,
      detalle: {
        antes: {
          nombre: anterior.nombre,
          profesion: anterior.profesion,
          funcion: anterior.funcion,
          rol: anterior.rol,
        },
        despues: {
          nombre: profesional.nombre,
          profesion: profesional.profesion,
          funcion: profesional.funcion,
          rol: profesional.rol,
        },
      },
    });

    return NextResponse.json(profesional);
  } catch (error) {
    console.error("[api/profesionales/[id] PATCH]", error);
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
          "No se pudo actualizar el profesional. Revisa la terminal del servidor.",
      },
      { status: 503 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requiereApiMaestrosEstudio();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Identificador invalido." }, { status: 400 });
  }

  try {
    const anterior = await prisma.profesional.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });
    if (!anterior) {
      return NextResponse.json({ error: "Profesional no encontrado." }, { status: 404 });
    }

    await prisma.profesional.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PROFESIONAL_ELIMINAR",
      entidad: "Profesional",
      entidadId: id,
      detalle: { nombre: anterior.nombre },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/profesionales/[id] DELETE]", error);
    if (esP2003(error)) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: hay asuntos que referencian a este profesional (a cargo, colaborador o contador). Reasignalos antes.",
        },
        { status: 409 },
      );
    }
    if (esP2025(error)) {
      return NextResponse.json({ error: "Profesional no encontrado." }, { status: 404 });
    }
    const detalle = mensajeErrorPrismaParaUsuario(error);
    const extraDev = mensajeErrorDesarrollo(error);
    return NextResponse.json(
      {
        error:
          detalle ??
          extraDev ??
          "No se pudo eliminar el profesional. Revisa la terminal del servidor.",
      },
      { status: 503 },
    );
  }
}
