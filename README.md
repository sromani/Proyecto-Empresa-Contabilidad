# Sistema de Gestion de Asuntos - Uruguay

Base en Next.js + Tailwind + PostgreSQL (Prisma) para:
- Gestion de clientes con RUT/CI uruguaya (persona fisica/juridica, contacto).
- Alta, edicion y baja de **socios** y **profesionales** desde la app (`/maestros`, rol ADMIN o SOCIO); APIs `GET`/`POST` y `PATCH`/`DELETE` por id (`/api/socios/[id]`, `/api/profesionales/[id]`). La baja en pantalla pide doble confirmacion; si hay asuntos vinculados, la API responde 409.
- Asuntos TODOS / NOTARIAL / LEGAL con profesional a cargo, fechas y alertas.
- Listado y ficha de asunto: movimientos, finalizar (socio/admin), reabrir (admin).
- Roles de aplicacion (ADMIN, SOCIO, PROFESIONAL, etc.) y auditoria en API.

## Tecnologias

- Next.js (App Router)
- Tailwind CSS
- PostgreSQL
- Prisma ORM

## Publicar en GitHub (`Proyecto-Empresa-Contablidad`)

El proyecto ya tiene Git local (rama `main`). **`.env` no se sube** (esta en `.gitignore`).

1. En GitHub: **New repository** → nombre `Proyecto-Empresa-Contablidad` (sin README si ya tenes commits locales).
2. Remote configurado en este clone: `https://github.com/sromani/Proyecto-Empresa-Contablidad.git`. Para subir:

```bash
git push -u origin main
```

Si necesitas crear el remote de nuevo (u otro usuario): `git remote add origin https://github.com/USUARIO/Proyecto-Empresa-Contablidad.git`. Si `origin` esta mal: `git remote remove origin` y volve a agregarlo.

GitHub pedira autenticacion (token personal o GitHub Desktop / Credential Manager).

## Configuracion local

1. Instalar dependencias:
   - `npm install`
2. Crear archivo `.env` usando `.env.example`:
   - Con Docker del repo (puerto host **5433** → Postgres interno **5432**): ver `.env.example`
   - Sin Docker (Postgres nativo): misma idea con tu usuario/clave/puerto reales.
   - `AUTH_SECRET` (minimo 32 caracteres en produccion; en desarrollo hay valor por defecto en codigo)
3. Generar cliente Prisma (conexion directa a PostgreSQL):
   - El cliente se genera en `src/generated/prisma` (no se commitea; `npm run build` ejecuta `prisma generate` antes).
   - `npm run prisma:generate`
   - Si el login u otras consultas dicen que la URL debe ser `prisma://`, el cliente estaba generado con `--no-engine` o quedo corrupto. **Cerra todo Node** (`npm run dev`, debug F5) y ejecuta:
   - `npm run prisma:generate:local` (borra `src/generated/prisma` y `node_modules/.prisma/client` y vuelve a generar)
4. Ejecutar migraciones:
   - `npm run prisma:migrate` (normaliza `DATABASE_URL` como la app: puerto 5432 local → 5433 con Docker del repo)
5. Cargar datos iniciales (socios, profesionales, asuntos y usuario **admin**):
   - `npm run prisma:seed`
6. Iniciar proyecto:
   - `npm run dev`
7. Si los puertos 3000–3002 quedan ocupados (varios `next dev`):
   - `npm run ports:free`

### PostgreSQL con Docker

Si la base corre en **Docker** y Next en tu máquina (`npm run dev`):

1. El host en `DATABASE_URL` debe ser **`127.0.0.1`** (recomendado en Windows) o `localhost`.
2. El puerto debe ser el de la **izquierda** en `ports` (en el repo: **`5433:5432`** → en la URL usás **5433**).
3. Usuario, contraseña y nombre de BD deben coincidir con las variables del contenedor (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).

Ejemplo con el `docker-compose.yml` incluido en el proyecto:

```bash
docker compose up -d
```

`.env` (en **Windows + Docker** conviene **`127.0.0.1`**, no `localhost`, para evitar errores de conexion):

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/estudio_uy?schema=public"
```

Arranque rapido (sube Docker, espera a Postgres y aplica migraciones):

```bash
npm run db:prepare
```

O manual: `npm run db:up`, esperar unos segundos, `npm run prisma:migrate`, `npm run prisma:seed`.

En **desarrollo**, la app reescribe `localhost` → `127.0.0.1` (Windows) y, si la URL usa **5432** en local, la pasa a **5433** (compose del repo). Para Postgres nativo en 5432: `DATABASE_URL_USE_LOCAL_PG_5432=1` en `.env`.

Si sigue sin conectar, en la raiz del proyecto ejecuta **`npm run db:diagnostico`**: muestra la URL (enmascarada), `docker ps` y prueba Prisma con la misma logica que la app.

Comprobaciones si falla la conexion:

- `docker ps` → debe verse `0.0.0.0:5433->5432/tcp` (5433 en tu PC, 5432 dentro del contenedor).
- Si cambias el mapeo en `docker-compose.yml`, el puerto en `DATABASE_URL` debe ser el de **izquierda** (host).

### Error `Cannot find module './638.js'` (u otro numero)

Eso es **cache corrupta** de Next (carpeta `.next`). En Windows suele pasar con varios `npm run dev` a la vez, corte de compilacion o antivirus.

**Solucion rapida:**

1. Cerrar **todas** las terminales donde corre Next / Node.
2. Ejecutar:
   - `npm run clean`
   - `npm run dev`

O en un solo paso: `npm run dev:clean`

Para compilar de cero: `npm run build:clean`

### ENOENT `vendor-chunks/next.js` u otros archivos dentro de `.next`

Es el mismo problema: **compilacion a medias** o **archivos borrados mientras Next corre**.

1. Cerrar **todo** (terminales, debug F5, otras ventanas con `npm run dev`).
2. `npm run clean`
3. `npm run dev`

En VS Code/Cursor, para depurar sin caché vieja, elegi la configuracion **Next.js: servidor (debug + limpiar cache)**.

**Recomendacion (Windows):** si el proyecto esta en **Escritorio** y usas **OneDrive**, los archivos de `.next` pueden romperse al sincronizar. Conviene mover el repo a una carpeta **fuera** de Escritorio, por ejemplo `C:\dev\Proyecto-Empresa-Contablidad`.

## Acceso y usuarios

- Pantalla de login: `/login`
- Usuario inicial: **admin** / clave **Admin1234.v1** (cambiar en produccion; definida en `src/lib/auth-inicial.ts` y `prisma/seed.js`)
- Si no podes entrar, ejecuta `npm run prisma:seed` (actualiza la clave de **admin**).
- En **desarrollo**, si la tabla de usuarios esta vacia, el primer intento de login crea **admin** con la misma clave inicial.
- Administracion de usuarios (solo rol ADMIN): `/admin/usuarios`
- Las rutas y APIs (excepto login y health API) requieren sesion (cookie httpOnly con JWT)
- Usa siempre la misma URL (por ejemplo solo `http://localhost:3000`), no mezclar `127.0.0.1` y `localhost` o la cookie no se guarda bien.
- Si **tras ingresar volves al login** o “no valida”: borrá las cookies del sitio y probá de nuevo. El **Middleware** solo comprueba que exista la cookie; la **firma JWT** se valida en Node (layout `app/(protegido)` y APIs con `requiereApiSesion`). En desarrollo el JWT usa clave fija en `session-token.ts`; `AUTH_SECRET` del `.env` solo en **produccion**.

## Endpoints principales

- `POST /api/clientes` crea cliente (validaciones RUT/CI, contacto)
- `GET /api/clientes` lista clientes; `?q=` busqueda
- `PATCH/DELETE /api/clientes/[id]` actualizar / baja (reglas de negocio)
- `GET /api/catalogos` catalogos para formularios
- `GET /api/asuntos` listado con filtros; `POST /api/asuntos` alta
- `GET/PATCH /api/asuntos/[id]` ficha, finalizar / reabrir
- `POST /api/asuntos/[id]/movimientos` nuevo movimiento

## Modulos actuales (UI protegida)

- `/clientes` — alta y listado con busqueda
- `/asuntos` — listado y filtros
- `/asuntos/nuevo` — alta de asunto
- `/asuntos/[id]` — ficha, movimientos y acciones por rol
- `/admin/usuarios` — usuarios y roles (solo ADMIN)
- `src/app/api`: APIs y auditoria

## Plan funcional (SSA)

- Gap funcional y estrategia de implementacion: `docs/rf-ssa-gap-implementacion.md`
- Backlog por sprints y criterios de aceptacion: `docs/ssa-backlog-sprints.md`
