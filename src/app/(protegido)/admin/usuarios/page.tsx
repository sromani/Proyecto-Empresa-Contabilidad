import { AdminUsuariosPanel } from "@/components/admin-usuarios-panel";

export default function AdminUsuariosPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 md:text-3xl">Administracion de usuarios</h1>
        <p className="mt-1 text-sm text-blue-900/70">
          Alta de usuarios, roles y estado. Solo accesible con rol administrador.
        </p>
      </div>
      <AdminUsuariosPanel />
    </section>
  );
}
