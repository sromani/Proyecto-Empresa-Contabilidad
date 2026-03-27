import { PanelMaestros } from "@/components/panel-maestros";

export default function MaestrosPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 md:text-3xl">Socios y equipo</h1>
        <p className="mt-1 text-sm text-blue-900/70">
          Dos altas: <strong>socio</strong> (rol fijo) y <strong>equipo</strong> (rol único que define el área).
          Nombre obligatorio en ambos; profesión y función opcionales donde corresponda. Solo administradores y
          socios.
        </p>
      </div>
      <PanelMaestros />
    </section>
  );
}
