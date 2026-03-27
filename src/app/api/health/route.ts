import { NextResponse } from "next/server";
import { mensajeErrorApiDbAcceso } from "@/lib/api-db";
import { prisma } from "@/lib/prisma";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  const databaseUrlConfigurada = Boolean(process.env.DATABASE_URL);

  if (!databaseUrlConfigurada) {
    return NextResponse.json(
      {
        ok: false,
        app: "ok",
        database: "error",
        detalle: "Falta DATABASE_URL en .env",
      },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      app: "ok",
      database: "ok",
      version: APP_VERSION,
      detalle: "Conexion con PostgreSQL activa",
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        app: "ok",
        database: "error",
        version: APP_VERSION,
        detalle: mensajeErrorApiDbAcceso(e),
      },
      { status: 503 },
    );
  }
}
