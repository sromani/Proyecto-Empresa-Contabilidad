import { PanelMaestros } from "@/components/panel-maestros";

export default function MaestrosPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 md:text-3xl">Socios y profesionales</h1>
        <p className="mt-1 text-sm text-blue-900/70">
          Alta de socios y profesionales del estudio (catalogo usado en asuntos). Solo administradores
          y socios.
        </p>
      </div>
      <PanelMaestros />
    </section>
  );
}
