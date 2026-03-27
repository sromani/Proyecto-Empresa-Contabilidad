"use client";

import { useActionState } from "react";
import { accionIniciarSesion, type EstadoLoginAccion } from "@/app/login/actions";

export function FormularioLogin() {
  const [estado, formAction, pendiente] = useActionState<EstadoLoginAccion, FormData>(
    accionIniciarSesion,
    null,
  );

  return (
    <form
      className="login-plain-card card-app mx-auto max-w-md space-y-5"
      action={formAction}
    >
      <div className="login-plain-card-head border-b border-blue-100 pb-4 text-center">
        <h1>Iniciar sesion</h1>
        <p className="sub">Usuario y clave del estudio</p>
      </div>

      <label className="login-plain-field block space-y-1.5">
        <span>Usuario</span>
        <input
          required
          autoComplete="username"
          className="login-plain-input input-app"
          name="usuario"
          placeholder="admin"
        />
      </label>

      <label className="login-plain-field block space-y-1.5">
        <span>Clave</span>
        <input
          required
          autoComplete="current-password"
          className="login-plain-input input-app"
          name="password"
          type="password"
        />
      </label>

      <button
        className="login-plain-btn btn-primary w-full"
        disabled={pendiente}
        type="submit"
      >
        {pendiente ? "Ingresando..." : "Ingresar"}
      </button>

      {estado?.error ? <p className="login-plain-error">{estado.error}</p> : null}

      <p className="login-plain-hint text-center text-xs text-blue-800/60">
        Usuario inicial: <strong>admin</strong> / clave: <strong>Admin1234.v1</strong> (cambiar en
        produccion)
      </p>
    </form>
  );
}
