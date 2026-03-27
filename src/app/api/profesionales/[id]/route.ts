import { NextResponse } from "next/server";
import { requiereApiMaestrosEstudio } from "@/lib/api-auth";
import {
  esPrismaValidacion,
  mensajeErrorDesarrollo,
  mensajeErrorPrismaParaUsuario,
  obtenerErrorConfiguracionDb,
} from "@/lib/api-db";
import { registrarAuditoria } from "@/lib/auditoria";
import { GrupoProfesional } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requiereFuncionEnEstudio, resolverGrupoPuestoDesdeBody } from "@/lib/profesional-equipo";

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
  const profesion = body?.profesion !== undefined ? String(body.profesion).trim() : undefined;
  const funcionExplicita = body?.funcion !== undefined;
  const funcionTrim = funcionExplicita ? String(body.funcion).trim() : "";

  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const max = 500;
  if (
    nombre.length > max ||
    (funcionExplicita && funcionTrim.length > max) ||
    (profesion !== undefined && profesion.length > max)
  ) {
    return NextResponse.json({ error: "Algun texto supera el limite permitido." }, { status: 400 });
  }

  try {
    const anterior = await prisma.profesional.findUnique({ where: { id } });
    if (!anterior) {
      return NextResponse.json({ error: "Miembro del equipo no encontrado." }, { status: 404 });
    }

    const cambiaRol =
      body?.rol !== undefined || body?.grupo !== undefined || body?.puesto !== undefined;
    let grupoFinal = anterior.grupo;
    let puestoFinal = anterior.puesto;
    if (cambiaRol) {
      const r = resolverGrupoPuestoDesdeBody(body);
      if (!r) {
        return NextResponse.json(
          { error: "Rol, grupo o puesto invalido. Usa un rol valido o la pareja grupo/puesto." },
          { status: 400 },
        );
      }
      grupoFinal = r.grupo;
      puestoFinal = r.puesto;
    }
    const funcion = funcionExplicita ? funcionTrim : anterior.funcion;
    if (requiereFuncionEnEstudio(grupoFinal) && !funcion) {
      return NextResponse.json(
        { error: "La funcion en el estudio es obligatoria para este tipo de miembro." },
        { status: 400 },
      );
    }

    if (
      anterior.grupo === GrupoProfesional.LEGAL_A_CARGO &&
      grupoFinal !== GrupoProfesional.LEGAL_A_CARGO
    ) {
      const otrosLegalACargo = await prisma.profesional.count({
        where: {
          grupo: GrupoProfesional.LEGAL_A_CARGO,
          id: { not: id },
        },
      });
      if (otrosLegalACargo === 0) {
        return NextResponse.json(
          {
            error:
              "No se puede cambiar de bloque: debe quedar al menos un profesional a cargo (escribano o abogado) en maestros.",
          },
          { status: 400 },
        );
      }
    }

    const profesional = await prisma.profesional.update({
      where: { id },
      data: {
        nombre,
        funcion,
        grupo: grupoFinal,
        puesto: puestoFinal,
        ...(profesion !== undefined ? { profesion } : {}),
      },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "PROFESIONAL_EDITAR",
      entidad: "Profesional",
      entidadId: profesional.id,
      detalle: {
        antes: {
          nombre: anterior.nombre,
          funcion: anterior.funcion,
          grupo: anterior.grupo,
          puesto: anterior.puesto,
        },
        despues: {
          nombre: profesional.nombre,
          funcion: profesional.funcion,
          grupo: profesional.grupo,
          puesto: profesional.puesto,
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
          "No se pudo actualizar al miembro del equipo. Revisa la terminal del servidor.",
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
      select: { id: true, nombre: true, grupo: true },
    });
    if (!anterior) {
      return NextResponse.json({ error: "Miembro del equipo no encontrado." }, { status: 404 });
    }

    if (anterior.grupo === GrupoProfesional.LEGAL_A_CARGO) {
      const otrosLegalACargo = await prisma.profesional.count({
        where: {
          grupo: GrupoProfesional.LEGAL_A_CARGO,
          id: { not: id },
        },
      });
      if (otrosLegalACargo === 0) {
        return NextResponse.json(
          {
            error:
              "No se puede eliminar el ultimo profesional a cargo (escribano o abogado). Carga otro en maestros antes de borrar este.",
          },
          { status: 409 },
        );
      }
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
            "No se puede eliminar: hay asuntos que referencian a este miembro del equipo (a cargo, colaboradores o contador). Reasignalos antes.",
        },
        { status: 409 },
      );
    }
    if (esP2025(error)) {
      return NextResponse.json({ error: "Miembro del equipo no encontrado." }, { status: 404 });
    }
    const detalle = mensajeErrorPrismaParaUsuario(error);
    const extraDev = mensajeErrorDesarrollo(error);
    return NextResponse.json(
      {
        error:
          detalle ??
          extraDev ??
          "No se pudo eliminar al miembro del equipo. Revisa la terminal del servidor.",
      },
      { status: 503 },
    );
  }
}
