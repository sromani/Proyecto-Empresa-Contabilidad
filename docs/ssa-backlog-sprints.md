# SSA - Backlog tecnico por sprints

Fecha: 21/03/2026  
Base: RF v1.0 + estado del proyecto actual

## Convencion
- Prioridad: `P0` (critico), `P1` (alto), `P2` (medio).
- Cada item incluye criterio de aceptacion corto y entregable visible.

## Sprint 0 - Estabilizacion y preparacion (1 semana)

## Objetivo
Eliminar riesgos operativos actuales y dejar base lista para evolucion funcional.

- [ ] `P0` Estandarizar arranque local en un solo puerto
  - Criterio: el equipo arranca con `npm run dev:clean` y no hay procesos duplicados.
- [ ] `P0` Hardening auth actual
  - Criterio: login/logout/me estable en `localhost:3000`, sin bucles ni pantalla blanca.
- [ ] `P1` Documento de arquitectura breve (`docs/arquitectura-ssa.md`)
  - Criterio: incluye modelo actual, modulos y decisiones abiertas.
- [ ] `P1` Pipeline de calidad minima
  - Criterio: `build` y checks se ejecutan localmente sin errores.

## Sprint 1 - Dominio de asuntos v2 (2 semanas)

## Objetivo
Implementar modelo de datos que soporte ciclo de vida y trazabilidad basica.

- [ ] `P0` Migracion Prisma: `EstadoAsunto`, `fechaInicio`, `fechaFinalizacion`, `ordinal`
  - Criterio: nuevos campos disponibles y migracion aplicada en entorno local.
- [ ] `P0` Migracion Prisma: responsables por rol (principal/colaborador/contador)
  - Criterio: asunto puede guardar responsables segun RF-06.
- [ ] `P0` API alta asunto adaptada a nuevo modelo
  - Criterio: crea asunto con `EN_TRAMITE`, `ordinal` y validaciones de fechas.
- [ ] `P1` Script de migracion de datos legacy (asuntos ya creados)
  - Criterio: datos existentes siguen accesibles tras migrar.

## Sprint 2 - Operacion diaria del asunto (2 semanas)

## Objetivo
Cubrir RF-03 y RF-04 completos (movimientos + cierre/reapertura).

- [ ] `P0` API registrar movimiento
  - Criterio: solo en `EN_TRAMITE`, persiste autor, fecha y descripcion.
- [ ] `P0` Ficha de asunto con historial cronologico
  - Criterio: muestra movimientos recientes primero.
- [ ] `P0` Finalizar asunto
  - Criterio: exige fecha finalizacion valida y registra auditoria.
- [ ] `P0` Reabrir asunto (solo ADMIN)
  - Criterio: borra fecha finalizacion, vuelve a `EN_TRAMITE` y audita evento.
- [ ] `P1` Campos de ultimo movimiento denormalizados
  - Criterio: listado no necesita joins complejos para ultima novedad.

## Sprint 3 - Listado principal y filtros (2 semanas)

## Objetivo
Entregar vista principal RF-07 usable por negocio.

- [ ] `P0` Pantalla "Listado de asuntos" con columnas RF
  - Criterio: incluye ordinal, cliente, tipo, asunto, profesional, alerta, ultimo movimiento, estado.
- [ ] `P0` Filtros por estado/tipo/socio/profesional/rangos/nombre/documento
  - Criterio: filtros combinables con paginacion.
- [ ] `P1` Busqueda global full-text basica
  - Criterio: busca en cliente, documento, descripcion y ultimo movimiento.
- [ ] `P1` Guardado de filtros en URL
  - Criterio: compartir enlace mantiene filtros.

## Sprint 4 - Alertas (1.5 semanas)

## Objetivo
Cubrir RF-05 con alertas in-app y base para email.

- [ ] `P0` Fecha de alerta en asunto + validaciones
  - Criterio: no permite alerta < fecha inicio.
- [ ] `P0` Job diario de alertas pendientes
  - Criterio: genera alertas para `fechaAlerta <= hoy` y `EN_TRAMITE`.
- [ ] `P0` Panel de alertas en inicio
  - Criterio: usuario ve alertas asignadas y puede marcarlas leidas.
- [ ] `P1` Vista dedicada de alertas pendientes con filtros
  - Criterio: filtrable por profesional y tipo.
- [ ] `P2` Envio SMTP opcional
  - Criterio: feature-flag activo/inactivo sin romper flujo in-app.

## Sprint 5 - Usuarios, perfiles y permisos finos (2 semanas)

## Objetivo
Completar RF-08 y visibilidad por rol/asignacion.

- [ ] `P0` Ampliar enum de roles de usuario
  - Criterio: soporta ADMIN, SOCIO, PROFESIONAL, COLABORADOR, CONTADOR, SOLO_LECTURA.
- [ ] `P0` Matriz de permisos por ruta/API
  - Criterio: pruebas de autorizacion cubren accesos permitidos/prohibidos.
- [ ] `P0` Restriccion de visibilidad de asuntos por rol y asignacion
  - Criterio: cada rol ve solo lo que le corresponde por RF.
- [ ] `P1` Gestion de email/areas habilitadas de usuario
  - Criterio: admin puede crear/editar usuario con esos campos.

## Sprint 6 - Auditoria y reportes (2 semanas)

## Objetivo
Cubrir RF-09 y RF-10 con trazabilidad explotable.

- [ ] `P0` Tabla de auditoria + helper transaccional
  - Criterio: se loguean create/update/delete/login/logout/cambio estado/reasignacion.
- [ ] `P0` Pantalla de consulta de auditoria
  - Criterio: filtros por usuario, accion, fechas y asunto.
- [ ] `P1` Reportes estandar en UI
  - Criterio: al menos 5 reportes del RF.
- [ ] `P1` Export xlsx con filtros aplicados
  - Criterio: archivo coincide con vista filtrada.
- [ ] `P2` Export PDF
  - Criterio: reporte imprimible, formato legible.

## Historias transversales (continuas)

- [ ] `P0` Pruebas de regresion de login/sesion/permisos.
- [ ] `P1` Seeds y datos de demo por entorno.
- [ ] `P1` Politica de backup diario y restauracion (script + runbook).
- [ ] `P1` Observabilidad minima (logs estructurados de errores y auditoria).

## Plan de migracion desde Excel (propuesto)

1) Definir plantilla canonica `import_asuntos.xlsx` con columnas obligatorias.  
2) Validar archivo (tipos, fechas, duplicados, documentos).  
3) Modo "previsualizacion" con errores por fila.  
4) Importacion transaccional por lotes (clientes, asuntos, movimientos iniciales).  
5) Reporte final: filas insertadas, omitidas y errores.  
6) Corte operativo y verificacion funcional con usuarios clave.

## Criterios de salida para "v1 aprobable"

Se considera lista para validacion de negocio cuando:
- RF-01 a RF-08 estan en `Completo` o `Parcial aceptado` por negocio.
- RF-10 (auditoria) esta operativo para eventos criticos.
- Login/permisos/listado/asuntos/movimientos funcionan sin incidencias bloqueantes.
- Hay script documentado para importacion inicial de Excel.

