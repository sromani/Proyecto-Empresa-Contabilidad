import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-blue-200/80 bg-white/90 p-8 shadow-blue-soft backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Portal del estudio
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 md:text-4xl">
          Sistema de gestión
        </h1>
        <p className="mt-3 max-w-2xl text-blue-900/80">
          Clientes, asuntos notariales y legales, y seguimiento — base en Next.js y PostgreSQL.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary inline-flex items-center justify-center" href="/clientes">
            Directorio de clientes
          </Link>
          <Link className="btn-secondary inline-flex items-center justify-center" href="/asuntos">
            Ver asuntos
          </Link>
          <Link className="btn-secondary inline-flex items-center justify-center" href="/asuntos/nuevo">
            Nuevo asunto
          </Link>
          <Link className="btn-secondary inline-flex items-center justify-center" href="/health">
            Estado del sistema
          </Link>
        </div>
      </div>
    </section>
  );
}
