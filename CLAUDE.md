# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado actual del repositorio

**Fases 0–6 implementadas y migraciones aplicadas** en el proyecto Supabase (oct-2026): incluye proyectos destacados, endurecimiento de seguridad y "funciones de lanzamiento" (motivo al rechazar, avisos dentro de la app, directorio por páginas, restablecer contraseña por el admin, editar/reenviar pop-ups, Mi cuenta, recuperar contraseña por correo, devolver a revisión desde el Historial). Sin tope de edad (mínimo 16). Textos legales **aprobados** por el área jurídica (`TEXTOS_LEGALES_VALIDADOS = true` en `src/config.js`) y correo oficial de contacto `edurural.giraldo.lucelly@gmail.com` (por defecto en `CORREO_CONTACTO`; se puede sobrescribir con `VITE_CORREO_CONTACTO`). Datos de prueba y demo retirados de la base (oct-2026). **Fase 7: solo faltan** el SMTP propio en Supabase (para que llegue el correo de recuperación), fijar el mínimo de contraseña en 8 en Authentication (la protección contra contraseñas filtradas es solo del plan Pro: el aviso del linter es aceptado mientras el proyecto sea gratuito) y las pruebas con jóvenes reales. Cuentas oficiales: líder `edurural.giraldo.lucelly@gmail.com`, admin `edurural.osorio.alejandro@gmail.com` (contraseñas: las tiene la persona; nunca las escribas en archivos versionados). Hoja de ruta: [fases-implementacion-insercion-laboral.md](fases-implementacion-insercion-laboral.md).

### Comandos

Desde la raíz del proyecto:

- `npm install` — instalar dependencias.
- `npm run dev` — servidor de desarrollo (Vite, http://localhost:5173).
- `npm run build` — build de producción a `dist/`.
- `npm run preview` — servir el build localmente.
- `npm run lint` — ESLint (`eslint .`).
- Si `npm run build`/`lint` fallan con módulos faltantes, `node_modules` quedó corrupto: `rm -rf node_modules && npm ci`.
- Pruebas de seguridad de la BD (contra un PostgreSQL **local**, no Supabase): `PGHOST=127.0.0.1 PGPORT=<puerto> bash supabase/tests/run.sh` — ver `supabase/tests/`. Debe terminar sin líneas `FALLA`. No hay tests de frontend.

Requiere un `.env` (copiar de `.env.example`) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. No hay tests configurados todavía — no inventes un comando de test.

### Estructura del código

- `src/main.jsx` — entrada (RouterProvider + AuthProvider).
- `src/index.css` — Tailwind v4 con los tokens de paleta/tipografías del mockup en `@theme` (genera `bg-fondo`, `text-tinta`, `bg-joven`, `font-display`, etc.); `src/styles/fonts.css` declara las fuentes self-hosted (`/public/fonts/*.woff2`, variables, subconjunto latino — sin CDN, por el requisito de bajo consumo).
- `src/lib/supabase.js` — cliente Supabase (lee las env `VITE_*`). `src/lib/database.types.ts` — tipos generados del esquema (regenerar tras cambios en la BD; referencia aunque la app sea JSX). Nota: el código usa columnas como `telefono`, `cupos`, `pago_estimado`, `municipio_id` en popups, `updated_at` que pueden haberse añadido en migraciones posteriores al `.sql` base; ante duda, consulta la BD real (MCP, proyecto `ofcnxaxqqcpbahkwnljk`) y no solo el archivo.
- `src/auth/AuthProvider.jsx` — expone `session`, `usuario` (fila de `public.usuarios` con el `rol`), `loading`, `signOut` vía `useAuth()`. `src/auth/ProtectedRoute.jsx` — protege por sesión y por rol (redirige al home del rol real si no coincide).
- `src/constants/roles.js` — `ROLES` y `HOME_POR_ROL` (coinciden con el check `usuarios.rol`).
- `src/routes/index.jsx` — todas las rutas en un solo `createBrowserRouter`, con **carga diferida** por pantalla (helper `perezoso`): públicas bajo `SoloInvitados`; áreas `/joven`, `/empresario`, `/lider` (acepta lider y admin) y `/admin` bajo `ProtectedRoute roles={[...]}` + `AppLayout`. Páginas en `src/pages/<rol>/`. `AppLayout` define el menú inferior por rol y un ancho mayor para lider/admin.
- `src/lib/*.js` — capa de datos (una función por consulta Supabase, sin lógica de datos en las páginas): `perfil`, `popups`, `contrataciones` (registrar/deshacer contratación, seguimiento, permanencia), `recursos`, `kpi` (indicadores + CSV), `usuarios`, `proyectos`, `aprobaciones`, `auth`, `whatsapp` (enlaces `wa.me`), `imagen` (WebP en el navegador), `edad` (`EDAD_MAXIMA`, hoy 35), `fechas`. Normalizan los embeds de PostgREST. Gotcha: `perfiles_joven` tiene dos FK hacia `usuarios` (`usuario_id`, `revisado_por`): los embeds deben nombrar la FK (`usuarios!perfiles_joven_usuario_id_fkey`).
- `src/hooks/useCatalogo.js` — base de `useMunicipios`/`useHabilidades`: reintenta con espera y guarda copia en `localStorage` (requisito de conexión inestable). `SelectorMunicipio` muestra "Cargando…" o aviso con "Reintentar".
- Reporte PDF del dashboard = impresión del navegador (`window.print()`) con estilos `@media print` en `index.css` (clases `no-imprimir` / `solo-impresion`); sin librerías de PDF.
- `src/config.js` — correo de contacto y marca de textos legales validados. Páginas legales: `pages/Legal.jsx`.
- Rutas comunes a todos los roles: `/avisos` (tabla `notificaciones`, la llenan disparadores `avisar_*` en la BD; la campana del encabezado consulta solo el conteo cada minuto) y `/cuenta` (`pages/MiCuenta.jsx`). Recuperación de contraseña: `/recuperar` → correo de Supabase → `/restablecer`. **Ojo:** el correo de Supabase por defecto solo llega a miembros del equipo del proyecto; para usuarios reales hay que configurar un SMTP propio (Authentication → SMTP) y agregar el dominio de producción en Authentication → URL Configuration. Mientras tanto el admin usa “Restablecer contraseña” (RPC `admin_restablecer_contrasena`).
- `src/components/` (`ui/` = primitivas), `src/layouts/` (`AppLayout`, `AuthShell`).
- `vercel.json` — rewrite SPA a `/index.html`.
- `public/assets/logo.jpg` — logo servido por Vite (copia del de la raíz).

Contenido de planeación/diseño (insumos, no parte del build):

- [planeacion-plataforma-insercion-laboral.md](planeacion-plataforma-insercion-laboral.md) — documento de planeación funcional/técnico completo (en español) para la plataforma. Fuente de verdad sobre roles, módulos y fases de construcción. Léelo primero para entender el alcance del producto. El modelo de datos detallado en su sección 4 es un esquema simplificado de referencia; el esquema real y autoritativo es [schema-supabase-insercion-laboral.sql](schema-supabase-insercion-laboral.sql) (ver más abajo), que ya lo desarrolla con más detalle (tablas puente, triggers, RLS).
- [fases-implementacion-insercion-laboral.md](fases-implementacion-insercion-laboral.md) — **hoja de ruta de construcción por fases (0 → 7)**, del proyecto vacío al lanzamiento, con criterio de "hecho" por fase, mapeo a las pantallas del mockup, stack definido, y una sección de consideraciones/sugerencias transversales (seguridad RLS, Habeas Data, bajo consumo, etc.). Es la guía de ejecución — consúltala al empezar cualquier fase de implementación.
- [schema-supabase-insercion-laboral.sql](schema-supabase-insercion-laboral.sql) — esquema SQL completo y listo para correr en el SQL Editor de Supabase: tablas, RLS por rol, funciones helper (`auth_usuario_id()`, `auth_rol()`), trigger de validación de autorización de menores, índices y la vista `vista_kpi_municipio`. **Es el modelo de datos autoritativo** — si hay diferencias con la sección 4 del documento de planeación, este archivo manda.
- [catalogo-habilidades-insercion-laboral.sql](catalogo-habilidades-insercion-laboral.sql) — seed de datos para la tabla `habilidades`, derivado de los 12 programas técnicos/tecnológicos de La Universidad en el Campo. Debe correrse **después** de `schema-supabase-insercion-laboral.sql` (depende de que la tabla `habilidades` ya exista).
- [textos-legales-insercion-laboral.md](textos-legales-insercion-laboral.md) — textos legales (autorización de datos, autorización de acudiente, política de tratamiento de datos, términos y condiciones), basados en la Ley 1581 de 2012 y el Decreto 1377 de 2013. **Aprobados por el área jurídica** (oct-2026); la versión publicada está en `src/pages/Legal.jsx`. Si se cambian, deben volver a revisión jurídica (y poner `TEXTOS_LEGALES_VALIDADOS = false` mientras tanto).
- [Flujo Joven.dc.html](Flujo%20Joven.dc.html) — un "design doc" generado por Claude Design: mockup visual estático (HTML con estilos inline) de las 20 pantallas clave del recorrido completo (joven, empresario, líder de área, admin), en versiones mobile y desktop. Es una referencia visual/de interacción, no código de producción.
- [support.js](support.js) — runtime generado automáticamente para renderizar el `.dc.html` en modo canvas. La cabecera del archivo dice explícitamente: **"GENERATED from dc-runtime/src/*.ts — do not edit"**. Nunca lo edites a mano; no forma parte de la lógica de negocio del proyecto.
- `assets/`, `uploads/` — imágenes (logo institucional) usadas por el mockup.
- `Perfiles Técnicos/` — fotos de muestra (headshots) para usar como datos de ejemplo/demo en perfiles de jóvenes durante diseño o pruebas; no son datos reales de usuarios.

### Supabase: proyecto dedicado

El proyecto correcto es **`App Insercion Laboral`** — id `ofcnxaxqqcpbahkwnljk`, región `sa-east-1`, accesible vía MCP *solo si la conexión MCP está autorizada con la cuenta/organización que lo contiene* (en oct-2026 la conexión llegó a ver únicamente otros proyectos: verifica con `list_projects` antes de asumir acceso; sin acceso, deja los cambios como archivos en `supabase/migrations/` y avisa). Ya tiene aplicado el esquema completo (12 tablas + vista KPI), el catálogo de 42 habilidades y los 27 municipios de Caldas. Los advisories de seguridad están en cero (RLS en todas las tablas incluidos catálogos, vista KPI con `security_invoker = on`, funciones con `search_path` fijo). ⚠️ La misma conexión MCP también expone `unidaddecalidadmanizales-dev's Project`, que es de **otra plataforma no relacionada** (tablas `procesos`, `indicadores`, `visitas`, etc. — sistema de seguimiento de calidad). **Nunca apliques nada de esta plataforma contra ese proyecto**; usa siempre `ofcnxaxqqcpbahkwnljk`.

**Escrituras en la BD desde el MCP:** en este entorno las herramientas de escritura del MCP de Supabase (`apply_migration`, `execute_sql` con DDL/DELETE) quedan rechazadas; la lectura sí funciona. Prepara el SQL en `supabase/migrations/` (o en `supabase/privado/`, ignorado por git, si lleva contraseñas) y pídele a la persona que lo pegue en el SQL Editor; luego verifica con consultas de solo lectura.

**Seguridad (lecciones de la revisión de oct-2026):** la RLS sola no basta. Cualquier persona con sesión puede llamar la API directamente, así que además de las políticas hay **triggers `proteger_*`** (sección 14 del esquema / migración `20261007000100`) que impiden: registrarse con rol `lider`/`admin` (`handle_new_user` solo acepta `joven`/`empresario`), cambiarse el propio `rol`/`estado`, auto-aprobar perfiles o pop-ups (solo lider/admin pasan a `aprobado`/`rechazado`; editar contenido aprobado lo devuelve a revisión), y crear postulaciones con estado forzado o a pop-ups no abiertos. Las lecturas de `perfiles_joven`, `popups` y sus tablas puente son `to authenticated` (antes un visitante anónimo podía leer perfiles con teléfono). Toda tabla/columna nueva con estado de moderación necesita su trigger, y se prueba en `supabase/tests/`. Otros gotchas: subir fotos con `upsert: false` (el bucket no tiene política de lectura); no llamar `supabase.auth.signOut()` con `await` dentro de `onAuthStateChange`.

Tras cualquier cambio de esquema (DDL): correr `get_advisors` y regenerar `src/lib/database.types.ts`. Si editas `schema-supabase-insercion-laboral.sql`, mantenlo reejecutable de principio a fin (las policies que usan `auth_rol()` deben ir después de definir esa función — ver sección 2b).

## Arquitectura

Definida en la sección 6 del documento de planeación (Fase 0 ya montó el andamiaje):

- **Frontend:** React + Vite (JSX)
- **Backend / datos / auth:** Supabase (Postgres + Auth + Row Level Security por rol + Storage para fotos/certificados)
- **Despliegue:** Vercel
- **Control de acceso:** RLS en Supabase — un joven solo edita su propio perfil, un empresario solo sus propios pop-ups; líder de área y admin tienen permisos ampliados vía políticas específicas.

### Roles y modelo de datos

Cuatro roles: `joven`, `empresario`, `lider` (de área), `admin`, como check constraint en `usuarios.rol`, tabla vinculada a `auth.users` de Supabase vía `auth_id`. El control de acceso vive en políticas RLS por tabla (no en la capa de aplicación) — cada tabla nueva que se agregue debe traer su propio `enable row level security` + políticas, siguiendo el patrón de `schema-supabase-insercion-laboral.sql`.

Tablas reales definidas en `schema-supabase-insercion-laboral.sql` (más `proyectos_joven (id, joven_id→perfiles_joven, titulo, descripcion, enlace, anio, orden)`, "proyectos destacados" del portafolio, hasta 3 por joven) (fuente autoritativa; difiere ligeramente del boceto de la sección 4 del documento de planeación — por ejemplo, `habilidades_requeridas[]` en `popups` se implementó como tabla puente `popup_habilidades`, y `usuarios` tiene columnas adicionales de Habeas Data):

```
municipios          (id, nombre)
habilidades         (id, nombre, categoria)
usuarios            (id, auth_id, rol, nombre, email, municipio_id, estado,
                     autorizacion_datos, fecha_autorizacion_datos,
                     es_menor_edad, autorizacion_acudiente, fecha_autorizacion_acudiente, created_at)
perfiles_joven      (id, usuario_id, formacion, presentacion, foto_url, estado_revision, revisado_por, fecha_revision)
joven_habilidades   (joven_id, habilidad_id)                -- puente muchos-a-muchos
empresas            (id, usuario_id, nombre_empresa, nit, sector, municipio_id)
popups              (id, empresa_id, titulo, descripcion, estado, revisado_por, fecha_publicacion, fecha_cierre)
popup_habilidades   (popup_id, habilidad_id)                -- puente muchos-a-muchos
postulaciones       (id, popup_id, joven_id, estado, created_at)  -- unique(popup_id, joven_id)
contrataciones      (id, postulacion_id, fecha_inicio, activo, fecha_ultimo_seguimiento)
recursos            (id, tipo, titulo, descripcion, url_recurso, fecha_publicacion, creado_por)
inscripciones       (id, recurso_id, joven_id, fecha)        -- unique(recurso_id, joven_id)
```

Además incluye la vista `vista_kpi_municipio` (base del dashboard KPI) y dos funciones helper usadas en casi todas las políticas RLS: `auth_usuario_id()` (mapea `auth.uid()` a la fila de `usuarios`) y `auth_rol()` (rol del usuario autenticado). Un trigger (`trg_validar_autorizacion_menor`) bloquea a nivel de base de datos que un `usuario` marcado `es_menor_edad = true` se guarde sin `autorizacion_acudiente = true` — el cumplimiento de Habeas Data para menores está forzado en el esquema, no solo en la UI.

Orden de ejecución del SQL: `schema-supabase-insercion-laboral.sql` primero (crea las tablas), luego `catalogo-habilidades-insercion-laboral.sql` (hace seed de `habilidades`, usa `on conflict (nombre) do nothing` así que es seguro re-ejecutarlo).

### Flujos clave

1. Joven se registra → completa perfil → líder aprueba → perfil visible en directorio.
2. Empresario se registra → busca talento por habilidad/municipio → contacta o publica pop-up.
3. Empresario publica pop-up → líder aprueba → jóvenes con habilidades coincidentes lo ven / se postulan.
4. Joven se postula → empresario revisa postulaciones → marca contratado.
5. Contratación registrada → entra a seguimiento → alimenta dashboard KPI.
6. Admin/líder revisan cola de aprobaciones (perfiles + pop-ups) y gestionan recursos educativos.

### Orden de construcción sugerido (sección 7)

Aunque el alcance final es el ecosistema completo, el orden reduce riesgo:

1. Base: Auth + roles + perfiles de joven + directorio para empresario.
2. Núcleo del modelo: Pop-ups + postulaciones + panel de aprobación (líder).
3. Cierre del ciclo: Contrataciones + seguimiento.
4. Valor institucional: Dashboard KPI + recursos educativos.

## Restricciones de producto no negociables (sección 8 del documento de planeación)

- **Habeas Data (Ley 1581 de 2012):** el registro debe bloquear el flujo hasta marcar la casilla de autorización de tratamiento de datos; para jóvenes de 16-17 años se requiere además autorización de acudiente/representante legal. Esto debe existir como columnas (`autorizacion_datos`, `autorizacion_acudiente`) en `usuarios`, no solo como validación de UI.
- **WhatsApp:** para el MVP no se integra la API de pago de WhatsApp Business. Se usan enlaces `wa.me` ("clic para chatear") sin costo ni proveedor (BSP). No agregar integraciones de mensajería de pago sin que el usuario lo pida explícitamente.
- **Mobile-first y bajo consumo de datos:** es un requisito no funcional explícito — imágenes optimizadas/comprimidas, carga progresiva, mínimo peso por página, pensado para móviles de gama media con conexión inestable.
- **Panel de líder de área sin dependencia técnica:** la aprobación de perfiles/pop-ups y la gestión de recursos deben poder operarse sin soporte técnico ad-hoc; prioriza UI simple sobre flexibilidad técnica.
- **Dashboard KPI exportable:** debe soportar exportación en CSV/PDF, no solo visualización en pantalla (se usa para reportes a la Subcomisión de Concertación de Políticas Laborales y Salariales y a financiadores).
- **Términos de uso y política de privacidad:** publicados en `/terminos` y `/privacidad` y aprobados por el área jurídica; se enlazan desde el registro y el pie de cada pantalla.

## Trabajando con el archivo `.dc.html`

`Flujo Joven.dc.html` es un artefacto de **Claude Design**, no una plantilla de la aplicación real. Si se pide ajustar el diseño visual o agregar pantallas al recorrido, edita el marcado dentro de `<x-dc>...</x-dc>` siguiendo el mismo patrón de estilos inline y la paleta de colores ya usada (fondo `#E8E7DC`, acentos `#E6007E` rosa/joven, `#00AEB9` turquesa/empresario, `#F39200` naranja, `#C6DB2E` verde lima, tipografías `Fredoka` para títulos y `Nunito Sans` para cuerpo). No toques `support.js`.

## Próximo paso previsto

Según el documento de planeación (sección 9), el siguiente paso tras el diseño visual es construir la aplicación real en Claude Code siguiendo el orden de fases de la sección 7, usando React + Vite en el frontend y Supabase como backend/auth/datos.
