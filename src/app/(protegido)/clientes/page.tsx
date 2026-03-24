import { VistaClientes } from "@/components/vista-clientes";

export default function ClientesPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 md:text-4xl">Clientes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-900/70">
          Alta, búsqueda y baja de personas físicas y jurídicas. Solo se permite eliminar si no tienen
          asuntos asociados ni asuntos en trámite.
        </p>
      </div>
      <VistaClientes />
    </section>
  );
}
