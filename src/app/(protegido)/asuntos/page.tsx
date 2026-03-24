import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";

export default function AsuntosPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-white via-blue-50/30 to-white px-5 py-5 shadow-sm shadow-blue-950/5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-950 md:text-3xl">Asuntos</h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-blue-900/75">
              Consultá el listado, refiná con filtros y abrí la ficha de cada expediente.
            </p>
          </div>
          <Link
            href="/asuntos/nuevo"
            className="btn-primary inline-flex w-full shrink-0 items-center justify-center px-5 py-2.5 text-sm font-semibold shadow-md shadow-blue-900/10 sm:w-auto"
          >
            Nuevo asunto
          </Link>
        </div>
      </div>
      <ListaAsuntos />
    </section>
  );
}
