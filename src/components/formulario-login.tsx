"use client";

import { useActionState } from "react";
import { accionIniciarSesion, type EstadoLoginAccion } from "@/app/login/actions";

export function FormularioLogin() {
  const [estado, formAction, pendiente] = useActionState<EstadoLoginAccion, FormData>(
    accionIniciarSesion,
    null,
  );

  return (
    <form className="card-app mx-auto max-w-md space-y-5" action={formAction}>
      <div className="border-b border-blue-100 pb-4 text-center">
        <h1 className="text-xl font-semibold text-blue-950">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-blue-800/70">Usuario y clave del estudio</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-blue-950">Usuario</span>
        <input
          required
          autoComplete="username"
          className="input-app"
          name="usuario"
          placeholder="admin"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-blue-950">Clave</span>
        <input
          required
          autoComplete="current-password"
          className="input-app"
          name="password"
          type="password"
        />
      </label>

      <button className="btn-primary w-full" disabled={pendiente} type="submit">
        {pendiente ? "Ingresando..." : "Ingresar"}
      </button>

      {estado?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {estado.error}
        </p>
      ) : null}

      <p className="text-center text-xs text-blue-800/60">
        Usuario inicial: <strong>admin</strong> / clave: <strong>Admin1234.v1</strong> (cambiar en
        produccion)
      </p>
    </form>
  );
}
