import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function obtenerEstadoSistema() {
  const databaseUrlConfigurada = Boolean(process.env.DATABASE_URL);

  if (!databaseUrlConfigurada) {
    return {
      statusCode: 503,
      ok: false,
      app: "ok",
      database: "error",
      detalle: "Falta DATABASE_URL en .env",
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      statusCode: 200,
      ok: true,
      app: "ok",
      database: "ok",
      detalle: "Conexion con PostgreSQL activa",
    };
  } catch {
    return {
      statusCode: 503,
      ok: false,
      app: "ok",
      database: "error",
      detalle: "No se pudo conectar a PostgreSQL",
    };
  }
}

export default async function HealthPage() {
  const estado = await obtenerEstadoSistema();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 md:text-3xl">Estado del Sistema</h1>
        <p className="mt-1 text-sm text-blue-900/70">
          Diagnostico rapido de aplicacion y base de datos PostgreSQL.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-blue-200/80 bg-white/95 p-5 shadow-blue-soft">
          <p className="text-sm font-medium text-blue-800/80">Aplicacion</p>
          <p
            className={`mt-2 text-xl font-bold ${
              estado.app === "ok" ? "text-blue-700" : "text-red-600"
            }`}
          >
            {estado.app.toUpperCase()}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200/80 bg-white/95 p-5 shadow-blue-soft">
          <p className="text-sm font-medium text-blue-800/80">Base de datos</p>
          <p
            className={`mt-2 text-xl font-bold ${
              estado.database === "ok" ? "text-sky-600" : "text-red-600"
            }`}
          >
            {estado.database.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200/80 bg-white/95 p-5 shadow-blue-soft">
        <p className="text-sm font-medium text-blue-800/80">HTTP</p>
        <p className="mt-2 text-xl font-bold text-blue-950">{estado.statusCode}</p>
      </div>

      <div className="rounded-xl border border-blue-200/80 bg-white/95 p-5 shadow-blue-soft">
        <p className="text-sm font-medium text-blue-800/80">Detalle</p>
        <p className="mt-2 text-blue-950">{estado.detalle}</p>
      </div>
    </section>
  );
}
