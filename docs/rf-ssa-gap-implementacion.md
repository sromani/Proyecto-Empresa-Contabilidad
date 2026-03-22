# SSA - Gap funcional y plan de implementacion

Fecha: 21/03/2026  
Fuente: RF v1.0 (20/03/2026) + estado actual del repositorio

## 1) Resumen ejecutivo

El sistema actual ya cubre una base solida:
- Login con sesion JWT en cookie httpOnly.
- Gestion de clientes (alta + listado API).
- Alta de asuntos con asignaciones y seguimiento inicial.
- Administracion basica de usuarios (ADMIN/USUARIO).
- Pantalla de health y proteccion de rutas privadas.

Faltan varias capacidades del RF para llegar a la version objetivo:
- Ciclo de vida formal del asunto (EN TRAMITE / FINALIZADO, reapertura admin).
- Historial completo y gestion de movimientos.
- Alertas de vencimiento y bandeja de alertas.
- Busqueda/filtros avanzados y listado principal de asuntos.
- Perfiles finos (Socio, Colaborador, Contador, Solo Lectura).
- Auditoria trazable de eventos clave.
- Reportes/exportacion (xlsx/pdf).

## 2) Mapa RF vs estado actual

Escala:
- `Completo`: implementado segun RF.
- `Parcial`: hay base, faltan reglas o pantallas.
- `No iniciado`: no hay implementacion funcional relevante.

### RF-01 Gestion de clientes - `Parcial`
- Implementado:
  - Alta de cliente con validaciones de documento uruguayo.
  - Listado de clientes por API.
- Falta:
  - Busqueda por documento/nombre en UI.
  - Ficha de cliente con asuntos asociados.
  - Edicion y baja condicionada (sin asuntos EN TRAMITE).
  - Auditoria de cambios.

### RF-02 Apertura de asuntos - `Parcial`
- Implementado:
  - Alta de asunto con tipo, cliente, socio, profesionales y seguimiento inicial.
  - Validaciones basicas.
- Falta:
  - `No. Ordinal` correlativo autogenerado.
  - Fecha de inicio editable (hoy toma createdAt implicito).
  - Roles separados: profesional principal vs colaborador vs contador referente.
  - Alerta de vencimiento y su validacion con fecha de inicio.
  - Estado inicial explicito `EN TRAMITE` (hoy existe `estado` string con default `ABIERTO`).

### RF-03 Ciclo de vida del asunto - `No iniciado` (funcionalmente)
- Implementado:
  - Campo `estado` en modelo, pero sin flujo formal.
- Falta:
  - Estados permitidos: `EN_TRAMITE` / `FINALIZADO`.
  - Finalizacion con fecha obligatoria y validaciones.
  - Reapertura solo admin, con trazabilidad.

### RF-04 Registro de movimientos - `Parcial`
- Implementado:
  - Al crear asunto se guarda seguimiento inicial en `Seguimiento`.
- Falta:
  - Pantalla/API para agregar movimientos luego del alta.
  - Regla "no agregar movimientos a FINALIZADO".
  - Campos derivados "ultimo movimiento" (fecha + texto) para listado.
  - Historial visible y ordenado.
  - Restriccion de no borrar movimientos (y correcciones como nuevo movimiento).

### RF-05 Alertas de vencimiento - `No iniciado`
- Falta todo:
  - Campo fecha de alerta en asunto.
  - Disparador diario / notificacion.
  - Bandeja de alertas pendientes.
  - Estado leida/no leida por usuario.
  - Envio por email opcional (SMTP).

### RF-06 Asignacion/reasignacion de responsables - `Parcial`
- Implementado:
  - Asignacion inicial de socio y multiples profesionales.
- Falta:
  - Roles diferenciados por responsabilidad (principal/colaborador/contador).
  - Reasignacion con permisos (ADMIN/SOCIO) y registro de auditoria.

### RF-07 Busqueda, filtros y vistas - `No iniciado` (UI principal)
- Implementado:
  - Hay formularios de alta.
- Falta:
  - Vista principal de asuntos con columnas del RF.
  - Filtros multiples y busqueda global.
  - Rango de fechas e indicadores de estado.

### RF-08 Usuarios y perfiles - `Parcial`
- Implementado:
  - Usuarios con hash bcrypt.
  - Alta/edicion/activacion por ADMIN.
  - Login/logout/me.
- Falta:
  - Perfiles RF: ADMIN, SOCIO, PROFESIONAL, COLABORADOR, CONTADOR, SOLO_LECTURA.
  - Permisos por area y por asunto asignado.
  - Email obligatorio y metadatos de perfil.

### RF-09 Reportes/exportacion - `No iniciado`
- Falta todo:
  - Reportes estandar.
  - Exportacion a xlsx y pdf respetando filtros.

### RF-10 Auditoria y trazabilidad - `No iniciado`
- Falta:
  - Entidad de auditoria.
  - Registro automatico de eventos clave.
  - Consulta filtrable y solo lectura.

## 3) Ajustes de modelo de datos recomendados (Prisma)

## Objetivo
Normalizar estados/roles y agregar campos necesarios para RF-02 a RF-10.

## Cambios propuestos
- `Usuario`
  - Reemplazar `RolApp` actual por `RolSistema` ampliado:
    - `ADMIN`, `SOCIO`, `PROFESIONAL`, `COLABORADOR`, `CONTADOR`, `SOLO_LECTURA`.
  - Agregar `email` (unique), `areasHabilitadas` (json o tabla relacional).

- `Cliente`
  - Agregar `tipoPersona` (`FISICA`, `JURIDICA`).
  - Separar `contacto` en campos opcionales: `telefono`, `email`, `domicilio`.
  - Mantener `documento` unique.

- `Asunto`
  - Agregar `ordinal` (Int @unique, autoincremental controlado).
  - Agregar `fechaInicio` (DateTime).
  - Agregar `descripcion` (string libre, hoy se usa catalogo; evaluar mantener ambos).
  - Reemplazar `estado` string por enum `EstadoAsunto`:
    - `EN_TRAMITE`, `FINALIZADO`.
  - Agregar `fechaFinalizacion` nullable.
  - Agregar `fechaAlertaVencimiento` nullable.
  - Agregar referencias para:
    - `profesionalACargoId` (obligatorio, 1 a 1 con Usuario/Profesional).
    - `colaboradorACargoId` (opcional).
    - `contadorReferenteId` (opcional).
    - Mantener `socioReferenteId` obligatorio.
  - Agregar `ultimoMovimientoFecha` y `ultimoMovimientoTexto` (denormalizado para listados rapidos).

- `Seguimiento` (movimientos)
  - Agregar `usuarioId` de quien registró.
  - Mantener solo insercion (sin delete/update por regla de negocio).

- `AlertaAsunto` (nueva)
  - `asuntoId`, `usuarioId`, `fechaDisparo`, `leidaEn`, `canal` (`IN_APP`, `EMAIL`), `estado`.

- `Auditoria` (nueva)
  - `id`, `fechaHora`, `usuarioId`, `accion`, `entidad`, `entidadId`, `valoresAntes`, `valoresDespues`, `ip`.

## 4) Decisiones funcionales a cerrar antes de construir

- Si "Asunto" sera:
  - Opcion A: texto libre principal (y opcionalmente catalogo sugerido), o
  - Opcion B: estrictamente catalogo.
- Si "TODOS" en tipo es un tipo real del asunto o un filtro de UI.
  - Recomendacion: `TODOS` solo en filtros; en BD guardar `LEGAL` o `NOTARIAL`.
- Si roles de responsables saldran de `Usuario` unificado o de tablas separadas de profesionales.
  - Recomendacion: unificar en `Usuario` con `rolSistema` + asignaciones.
- Politica de inactividad de sesion:
  - RF pide 30 min de inactividad (hoy hay 7 dias fijos).

## 5) Orden de implementacion recomendado (macro)

1. Base de dominio:
   - migraciones de `Asunto`, estados, fechas, movimientos, auditoria.
2. Flujo operativo:
   - listado de asuntos + ficha + movimientos + cierre/reapertura.
3. Seguridad/permisos:
   - perfiles RF completos y filtros por visibilidad.
4. Alertas:
   - bandeja + job diario + opcion email.
5. Reportes:
   - filtros + export xlsx/pdf.

---

Este documento debe leerse junto con `docs\ssa-backlog-sprints.md`.
