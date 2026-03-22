"use client";

import { useCallback, useEffect, useState } from "react";

const ROLES_APP = [
  "ADMIN",
  "SOCIO",
  "PROFESIONAL",
  "COLABORADOR",
  "CONTADOR",
  "SOLO_LECTURA",
  "USUARIO",
] as const;

type RolAppUi = (typeof ROLES_APP)[number];

type UsuarioLista = {
  id: string;
  usuario: string;
  nombre: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export function AdminUsuariosPanel() {
  const [lista, setLista] = useState<UsuarioLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolAppUi>("PROFESIONAL");
  const [creando, setCreando] = useState(false);
  const [actualizandoRol, setActualizandoRol] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const response = await fetch("/api/admin/usuarios");
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cargar la lista.");
        return;
      }
      setLista(data);
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar().catch(() => {
      setCargando(false);
      setMensaje("Error de conexion.");
    });
  }, [cargar]);

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    setMensaje("");
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, nombre, password, rol }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo crear el usuario.");
        return;
      }
      setUsuario("");
      setNombre("");
      setPassword("");
      setRol("PROFESIONAL");
      await cargar();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setCreando(false);
    }
  }

  async function alternarActivo(u: UsuarioLista) {
    setMensaje("");
    try {
      const response = await fetch(`/api/admin/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !u.activo }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo actualizar.");
        return;
      }
      await cargar();
    } catch {
      setMensaje("Error de conexion.");
    }
  }

  async function cambiarRolUsuario(u: UsuarioLista, nuevoRol: RolAppUi) {
    if (nuevoRol === u.rol) return;
    setActualizandoRol(u.id);
    setMensaje("");
    try {
      const response = await fetch(`/api/admin/usuarios/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: nuevoRol }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo cambiar el rol.");
        return;
      }
      await cargar();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setActualizandoRol(null);
    }
  }

  return (
    <div className="space-y-8">
      <form className="card-app space-y-4" onSubmit={crearUsuario}>
        <h2 className="text-lg font-semibold text-blue-950">Nuevo usuario</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-blue-950">Usuario (login)</span>
            <input
              className="input-app"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-blue-950">Nombre visible</span>
            <input className="input-app" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-blue-950">Clave inicial</span>
            <input
              className="input-app"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-blue-950">Rol en la app</span>
            <select className="input-app" value={rol} onChange={(e) => setRol(e.target.value as RolAppUi)}>
              {ROLES_APP.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn-primary" disabled={creando} type="submit">
          {creando ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      {mensaje ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{mensaje}</p>
      ) : null}

      <div className="card-app overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold text-blue-950">Usuarios</h2>
        {cargando ? (
          <p className="text-sm text-blue-800/70">Cargando...</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-blue-200 text-blue-900/80">
                <th className="pb-2 pr-2 font-medium">Usuario</th>
                <th className="pb-2 pr-2 font-medium">Nombre</th>
                <th className="pb-2 pr-2 font-medium">Rol</th>
                <th className="pb-2 pr-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id} className="border-b border-blue-100/80">
                  <td className="py-3 pr-2 font-medium text-blue-950">{u.usuario}</td>
                  <td className="py-3 pr-2 text-blue-900">{u.nombre}</td>
                  <td className="py-3 pr-2">
                    <select
                      className="input-app max-w-[220px] py-1.5 text-xs"
                      value={u.rol}
                      disabled={actualizandoRol === u.id}
                      onChange={(e) =>
                        void cambiarRolUsuario(u, e.target.value as RolAppUi).catch(() =>
                          setMensaje("Error de conexion."),
                        )
                      }
                    >
                      {!(ROLES_APP as readonly string[]).includes(u.rol) ? (
                        <option value={u.rol}>{u.rol} (actual)</option>
                      ) : null}
                      {ROLES_APP.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-2">
                    {u.activo ? (
                      <span className="text-emerald-700">Activo</span>
                    ) : (
                      <span className="text-red-700">Inactivo</span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      className="btn-secondary px-2 py-1 text-xs"
                      type="button"
                      onClick={() =>
                        void alternarActivo(u).catch(() =>
                          setMensaje("Error de conexion."),
                        )
                      }
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
