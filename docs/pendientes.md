# Pendientes / recordatorios

## Seguridad — antes de producción

- [ ] **Quitar la clave inicial del UI**: en `src/components/formulario-login.tsx` no mostrar `Admin1234.v1` (ni credenciales) en pantalla.
- [ ] **Ajustar README**: no publicar la contraseña por defecto; documentar solo de forma interna o vía canal seguro.
- La clave por código sigue en `src/lib/auth-inicial.ts` y `prisma/seed.js` — valor solo para desarrollo / primer despliegue controlado.

_Fecha del recordatorio: marzo 2026._
