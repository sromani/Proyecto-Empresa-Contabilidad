import { NextResponse } from "next/server";
import { requiereApiSesion } from "@/lib/api-auth";
import { obtenerErrorConfiguracionDb } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import {
  esTipoDocumentoCliente,
  mensajeValidacionDocumentoCliente,
  normalizarDocumentoCliente,
} from "@/lib/validaciones";

/**
 * Busqueda exacta por numero de documento normalizado (unico en BD).
 * Query: tipoDocumento, documento (valor ingresado; se normaliza en servidor).
 */
export async function GET(request: Request) {
  const auth = await requiereApiSesion();
  if (!auth.ok) {
    return auth.response;
  }

  const errorConfiguracion = obtenerErrorConfiguracionDb();
  if (errorConfiguracion) {
    return NextResponse.json({ error: errorConfiguracion }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const tipoRaw = String(searchParams.get("tipoDocumento") ?? "").toUpperCase();
  const docBruto = String(searchParams.get("documento") ?? "");

  if (!esTipoDocumentoCliente(tipoRaw)) {
    return NextResponse.json({ error: "Tipo de documento invalido.", encontrado: false }, { status: 400 });
  }

  const errVal = mensajeValidacionDocumentoCliente(tipoRaw, docBruto);
  if (errVal) {
    return NextResponse.json({ error: errVal, encontrado: false }, { status: 400 });
  }

  const documento = normalizarDocumentoCliente(tipoRaw, docBruto);

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { documento },
      select: {
        id: true,
        nombre: true,
        tipoDocumento: true,
        tipoPersona: true,
        documento: true,
        contacto: true,
        telefono: true,
        email: true,
        domicilio: true,
      },
    });

    if (!cliente) {
      return NextResponse.json({ encontrado: false });
    }

    return NextResponse.json({ encontrado: true, cliente });
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar el cliente.", encontrado: false },
      { status: 503 },
    );
  }
}
