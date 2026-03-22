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
  if (!nombre) {
    return NextResponse.json({ error: "El nombre del socio es obligatorio." }, { status: 400 });
  }
  if (nombre.length > 500) {
    return NextResponse.json({ error: "El nombre es demasiado largo." }, { status: 400 });
  }

  try {
    const anterior = await prisma.socio.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
    }

    const socio = await prisma.socio.update({
      where: { id },
      data: { nombre },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "SOCIO_EDITAR",
      entidad: "Socio",
      entidadId: socio.id,
      detalle: { antes: { nombre: anterior.nombre }, despues: { nombre: socio.nombre } },
    });

    return NextResponse.json(socio);
  } catch (error) {
    console.error("[api/socios/[id] PATCH]", error);
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
          "No se pudo actualizar el socio. Revisa la terminal del servidor.",
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
    const anterior = await prisma.socio.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });
    if (!anterior) {
      return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
    }

    await prisma.socio.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "SOCIO_ELIMINAR",
      entidad: "Socio",
      entidadId: id,
      detalle: { nombre: anterior.nombre },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/socios/[id] DELETE]", error);
    if (esP2003(error)) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: hay asuntos que referencian a este socio. Reasignalos o archivalos antes.",
        },
        { status: 409 },
      );
    }
    if (esP2025(error)) {
      return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
    }
    const detalle = mensajeErrorPrismaParaUsuario(error);
    const extraDev = mensajeErrorDesarrollo(error);
    return NextResponse.json(
      {
        error:
          detalle ??
          extraDev ??
          "No se pudo eliminar el socio. Revisa la terminal del servidor.",
      },
      { status: 503 },
    );
  }
}
