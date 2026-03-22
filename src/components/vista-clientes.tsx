"use client";

import { useState } from "react";
import { FormularioCliente } from "@/components/formulario-cliente";
import { ListaClientes } from "@/components/lista-clientes";

export function VistaClientes() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <FormularioCliente onClienteCreado={() => setRefreshKey((k) => k + 1)} />
      <ListaClientes refreshKey={refreshKey} />
    </div>
  );
}
