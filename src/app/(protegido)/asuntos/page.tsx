import Link from "next/link";
import { ListaAsuntos } from "@/components/lista-asuntos";

export default function AsuntosPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 md:text-3xl">Asuntos</h1>
          <p className="mt-1 text-sm text-blue-900/70">Listado, filtros y acceso a la ficha de cada asunto.</p>
        </div>
        <Link
          href="/asuntos/nuevo"
          className="btn-primary inline-flex w-fit items-center justify-center px-4 py-2 text-sm font-medium"
        >
          Nuevo asunto
        </Link>
      </div>
      <ListaAsuntos />
    </section>
  );
}
