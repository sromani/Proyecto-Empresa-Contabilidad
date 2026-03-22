import { redirect } from "next/navigation";
import { FormularioLogin } from "@/components/formulario-login";
import { obtenerSesionServidor } from "@/lib/session-server";

export default async function LoginPage() {
  const sesion = await obtenerSesionServidor();
  if (sesion) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <FormularioLogin />
    </div>
  );
}
