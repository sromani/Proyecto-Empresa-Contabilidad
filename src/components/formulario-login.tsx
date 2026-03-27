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
        <p className="sub">Usuario y clave de acceso</p>
      </div>

      <label className="login-plain-field block space-y-1.5">
        <span>Usuario</span>
        <input
          required
          autoComplete="username"
          className="login-plain-input input-app"
          name="usuario"
          placeholder="Tu usuario"
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
    </form>
  );
}
