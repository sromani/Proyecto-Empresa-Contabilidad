import { TipoPersona } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  esPrismaValidacion,
  mensajeErrorDesarrollo,
  mensajeErrorPrismaParaUsuario,
  obtenerErrorConfiguracionDb,
} from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import { esCiUruguayValida, esRutValido, limpiarDocumento } from "@/lib/validaciones";

type TipoDocumento = "RUT" | "CI";

export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    const clientes = await prisma.cliente.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { documento: { contains: q, mode: "insensitive" } },
              { contacto: { contains: q, mode: "insensitive" } },
              { telefono: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json(clientes);
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar a PostgreSQL. Revisa DATABASE_URL y el servidor de base." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requiereApiSesion();
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

  try {
    const tipoDocumento = String(body?.tipoDocumento ?? "") as TipoDocumento;
    const tipoPersonaRaw = String(body?.tipoPersona ?? "FISICA").toUpperCase();
    const tipoPersona =
      tipoPersonaRaw === "JURIDICA" ? TipoPersona.JURIDICA : TipoPersona.FISICA;
    const nombre = String(body?.nombre ?? "").trim();
    const contacto = body?.contacto != null ? String(body.contacto).trim() || null : null;
    const telefono = body?.telefono != null ? String(body.telefono).trim() || null : null;
    const email = body?.email != null ? String(body.email).trim() || null : null;
    const domicilio = body?.domicilio != null ? String(body.domicilio).trim() || null : null;
    const documento = limpiarDocumento(String(body?.documento ?? ""));

    if (tipoDocumento !== "RUT" && tipoDocumento !== "CI") {
      return NextResponse.json({ error: "Tipo de documento invalido." }, { status: 400 });
    }

    if (tipoPersonaRaw !== "FISICA" && tipoPersonaRaw !== "JURIDICA") {
      return NextResponse.json({ error: "Tipo de persona invalido." }, { status: 400 });
    }

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    if (!contacto && !telefono && !email) {
      return NextResponse.json(
        { error: "Indica al menos un medio de contacto (contacto, telefono o email)." },
        { status: 400 },
      );
    }

    if (tipoDocumento === "RUT" && !esRutValido(documento)) {
      return NextResponse.json({ error: "El RUT debe tener exactamente 12 digitos." }, { status: 400 });
    }

    if (tipoDocumento === "CI" && !esCiUruguayValida(documento)) {
      return NextResponse.json(
        { error: "La CI ingresada no es valida para Uruguay." },
        { status: 400 },
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        tipoDocumento,
        tipoPersona,
        documento,
        nombre,
        contacto,
        telefono,
        email,
        domicilio,
      },
    });

    await registrarAuditoria({
      usuarioId: auth.sesion.sub,
      accion: "CLIENTE_CREAR",
      entidad: "Cliente",
      entidadId: cliente.id,
      detalle: { documento: cliente.documento },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("[api/clientes POST]", error);
    if (esPrismaValidacion(error)) {
      return NextResponse.json(
        { error: `Datos invalidos: ${error.message.split("\n")[0] ?? error.message}` },
        { status: 400 },
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Ya existe un cliente con ese documento." }, { status: 409 });
    }
    const detalle = mensajeErrorPrismaParaUsuario(error);
    const extraDev = mensajeErrorDesarrollo(error);
    return NextResponse.json(
      {
        error:
          detalle ??
          extraDev ??
          "No se pudo crear el cliente. Revisa la terminal del servidor (mensaje [api/clientes POST]) y ejecuta npm run db:diagnostico.",
      },
      { status: 503 },
    );
  }
}
