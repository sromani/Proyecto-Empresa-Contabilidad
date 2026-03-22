import Link from "next/link";
import { FormularioAsunto } from "@/components/formulario-asunto";

export default function AsuntoNuevoPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-blue-800/70">
          <Link href="/asuntos" className="font-medium text-blue-700 underline">
            Asuntos
          </Link>{" "}
          / Nuevo
        </p>
        <h1 className="mt-1 text-2xl font-bold text-blue-950 md:text-3xl">Alta de asunto</h1>
        <p className="mt-1 text-sm text-blue-900/70">
          Tras crear se abre la ficha del asunto con seguimiento y acciones permitidas por rol.
        </p>
      </div>
      <FormularioAsunto />
    </section>
  );
}
