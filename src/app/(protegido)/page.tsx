import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-blue-200/80 bg-white/90 p-5 shadow-blue-soft backdrop-blur-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Departamento Legal y Notarial
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl md:text-4xl">
          Sistema de gestión
        </h1>
        <p className="mt-3 max-w-2xl text-blue-900/80">
          Clientes, asuntos notariales y legales, y seguimiento.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            className="btn-primary inline-flex w-full items-center justify-center sm:w-auto"
            href="/asuntos"
          >
            Asuntos
          </Link>
          <Link
            className="btn-secondary inline-flex w-full items-center justify-center sm:w-auto"
            href="/clientes"
          >
            Clientes
          </Link>
        </div>
      </div>
    </section>
  );
}
