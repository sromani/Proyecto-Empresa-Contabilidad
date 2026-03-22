import { VistaClientes } from "@/components/vista-clientes";

export default function ClientesPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600/90">
          Cartera del estudio
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 md:text-4xl">
          Directorio de{" "}
          <span className="bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text font-semibold text-transparent">
            clientes
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-900/70">
          Alta, búsqueda y baja de personas físicas y jurídicas. Solo se permite eliminar si no tienen
          asuntos asociados ni asuntos en trámite.
        </p>
      </div>
      <VistaClientes />
    </section>
  );
}
