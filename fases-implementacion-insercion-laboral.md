# Plan de Implementación por Fases — Plataforma de Inserción Laboral

**Comité de Cafeteros de Caldas — Área de Educación / Línea de Inserción Laboral**

---

## Propósito de este documento

Este documento organiza la construcción completa de la plataforma en **fases secuenciales**, desde el proyecto vacío hasta el lanzamiento. Cada fase entrega algo funcional y verificable, y reduce riesgo antes de pasar a la siguiente. Al final se incluyen **consideraciones y sugerencias** transversales.

No es un documento de código: es la hoja de ruta que guía la ejecución en Claude Code. La lógica funcional, el modelo de datos y las restricciones ya están definidos en los archivos fuente del repositorio.

### Cómo leerlo

- Las fases están numeradas 0 → 7 y se ejecutan **en orden**. Cada fase asume que la anterior está terminada y verificada.
- Cada fase indica: **objetivo**, **alcance**, **tablas / RLS** que toca, **pantallas del mockup** que implementa, y su **criterio de "hecho"**.
- Las Fases 1–6 construyen el producto; la Fase 0 es preparación técnica y la Fase 7 es cierre para lanzamiento.

### Archivos fuente (insumos ya existentes en la raíz)

| Archivo | Qué aporta |
|---|---|
| [planeacion-plataforma-insercion-laboral.md](planeacion-plataforma-insercion-laboral.md) | Fuente de verdad funcional: roles, módulos, flujos, restricciones no negociables. |
| [schema-supabase-insercion-laboral.sql](schema-supabase-insercion-laboral.sql) | **Modelo de datos autoritativo**: tablas, RLS por rol, funciones helper, trigger de menor de edad, vista KPI. |
| [catalogo-habilidades-insercion-laboral.sql](catalogo-habilidades-insercion-laboral.sql) | Seed de la tabla `habilidades` (12 programas de La Universidad en el Campo). |
| [textos-legales-insercion-laboral.md](textos-legales-insercion-laboral.md) | Borrador de textos legales (Habeas Data, términos). **Pendiente validación jurídica.** |
| [Flujo Joven.dc.html](Flujo%20Joven.dc.html) | Diseño visual: 20 pantallas (mobile + desktop). Referencia de look & feel. |
| `Perfiles Técnicos/` | Fotos de muestra para datos de demo/QA (no son usuarios reales). |

### Stack técnico definido

- **Frontend:** React + Vite (JSX).
- **Estilos:** Tailwind CSS con la paleta y tipografías del mockup como tokens del tema. Fuentes **self-hosted** (no CDN de Google) por el requisito de bajo consumo de datos. Tailwind purga a un CSS mínimo → cumple mobile-first y replica el look custom del mockup con fidelidad. Sin librería de componentes pesada; primitivas headless solo donde un patrón concreto (modal, dropdown) lo amerite.
- **Backend / Auth / Datos / Storage:** Supabase.
- **Despliegue:** Vercel.

### Proyecto Supabase

- Proyecto dedicado: **`App Insercion Laboral`** — id `ofcnxaxqqcpbahkwnljk`, región `sa-east-1`. Actualmente **vacío** (el schema se aplica en Fase 0).
- ⚠️ No confundir con `unidaddecalidadmanizales-dev's Project`, que pertenece a **otra plataforma** (sistema de seguimiento de calidad). No aplicar nada de este proyecto ahí.

### Paleta y tipografías (tokens de diseño)

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#E8E7DC` | Fondo general (con patrón de puntos). |
| Tinta | `#171810` | Texto principal / superficies oscuras. |
| Joven | `#E6007E` (rosa) | Acento del rol joven. |
| Empresario | `#00AEB9` (turquesa) | Acento del rol empresario. |
| Naranja | `#F39200` | Acento secundario / líder. |
| Lima | `#C6DB2E` | Acento secundario / admin. |
| Títulos | `Fredoka` | Encabezados. |
| Cuerpo | `Nunito Sans` | Texto de cuerpo. |

---

## Estado de ejecución (7 de octubre de 2026)

| Fase | Estado | Notas |
|---|---|---|
| 0–4 | Hechas | Cimientos, acceso con Habeas Data, perfil + directorio, pop-ups + postulaciones, panel de aprobación. |
| 5 | Hecha | Al contratar se crea el registro en `contrataciones`; pantalla **Contratados** (empresario) y **Seguimiento** (líder/admin) con permanencia y alerta a los 30 días sin confirmar. |
| 6 | Hecha | Dashboard de indicadores con exportación **CSV** y **PDF** (impresión del navegador), biblioteca de **recursos** con inscripción y su gestión por el equipo, y gestión de **usuarios** del admin. |
| 7 | Abierta | Pendiente solo del Comité: validación jurídica de textos legales, correo oficial de contacto y pruebas con jóvenes reales. Hecho además: cuentas oficiales de líder y admin, migraciones aplicadas, avisos dentro de la app, motivo al rechazar, editar/reenviar pop-ups, Mi cuenta, recuperar y restablecer contraseña, directorio por páginas y deshacer decisiones desde el Historial. Ya hecho: páginas de términos/privacidad (con aviso de "en revisión"), carga diferida por pantalla, encabezados de seguridad, endurecimiento de la base de datos (`supabase/migrations/`) y banco de pruebas de seguridad (`supabase/tests/`). |

Cambios por observaciones de las pruebas con usuarios: selector de municipio robusto ante conexión inestable, sin tope de edad (mínimo 16 años), sección de **proyectos destacados** en el portafolio, y corrección de la subida de foto de perfil.

---

## Resumen de fases

| Fase | Objetivo | Pantallas mockup | Entregable verificable |
|---|---|---|---|
| **0** | Cimientos técnicos | — | App vacía desplegada + BD con esquema y catálogos |
| **1** | Auth, roles y onboarding | 01–07 | Usuario se registra (con Habeas Data), inicia sesión y ve su home por rol |
| **2** | Perfil del joven + directorio empresario | 08–13 | Joven crea perfil aprobable; empresario lo encuentra por filtros |
| **3** | Pop-ups y postulaciones | 14–16 | Empresario publica pop-up; joven se postula |
| **4** | Panel de aprobación (líder) | 17–18 | Líder aprueba/rechaza perfiles y pop-ups |
| **5** | Contrataciones y seguimiento | — | Empresario marca contratado; se registra seguimiento |
| **6** | Dashboard KPI + recursos educativos | 19–20 | Admin ve KPIs exportables; jóvenes se inscriben a recursos |
| **7** | Cierre para lanzamiento | — | Legal validado, seguridad auditada, optimización de datos |

---

## Fase 0 — Cimientos técnicos

**Objetivo:** dejar el terreno listo para construir features: proyecto frontend, conexión a datos, y base de datos poblada con el esquema.

**Alcance:**
- Scaffold del proyecto **React + Vite**.
- Configurar **Tailwind CSS** con los tokens de paleta y tipografías del mockup en el tema.
- **Fuentes self-hosted** (Fredoka + Nunito Sans, subconjunto latino) para no depender del CDN de Google y reducir peso.
- Cliente de **Supabase** + variables de entorno (`.env` con URL y clave *publishable*; nunca claves de servicio en el frontend).
- Estructura de carpetas base: proveedor de sesión/auth, contexto de rol, componente de **ruta protegida por rol**, layout mobile-first.
- Aplicar a `ofcnxaxqqcpbahkwnljk`, en orden: `schema-supabase-insercion-laboral.sql` → `catalogo-habilidades-insercion-laboral.sql` (vía MCP `apply_migration`).
- Sembrar la tabla `municipios` con los municipios de Caldas.
- Generar **tipos TypeScript** desde el esquema de Supabase.
- Pipeline de **deploy a Vercel** (preview + producción) con variables de entorno configuradas.

**Tablas / RLS:** crea todo el esquema. Verificar con `get_advisors` que RLS quedó habilitado en todas las tablas.

**Criterio de "hecho":** la app arranca en local y en Vercel, se conecta a Supabase, y la BD tiene todas las tablas + catálogo de habilidades + municipios.

---

## Fase 1 — Auth, roles y onboarding

**Objetivo:** que joven y empresario puedan crear cuenta, iniciar sesión y llegar a su espacio según rol, cumpliendo Habeas Data desde el registro.

**Alcance:**
- **Registro separado** por tipo de usuario (formulario distinto joven vs. empresario).
- **Gating Habeas Data (no negociable):** el registro se bloquea hasta marcar `autorizacion_datos`. Para jóvenes de **16–17 años** (`es_menor_edad = true`) se exige además `autorizacion_acudiente`. El trigger `trg_validar_autorizacion_menor` ya refuerza esto en BD; la UI debe replicar el bloqueo y guardar los timestamps de autorización.
- **Login único** con redirección por rol (`joven` / `empresario` / `lider` / `admin`).
- Creación de la fila en `usuarios` vinculada a `auth.users` tras el signup.
- **Onboarding** corto y diferenciado (joven vs. empresario) en el primer ingreso.

**Tablas / RLS:** `usuarios` (insert propio), funciones `auth_usuario_id()` / `auth_rol()` en uso.

**Pantallas mockup:** 01 Bienvenida · 02 Crear cuenta joven · 03 Iniciar sesión · 04 Desktop registro/login split-screen · 05–07 Onboarding pasos 1–3.

**Criterio de "hecho":** un joven de prueba y un empresario de prueba se registran (con las casillas obligatorias), inician sesión y aterrizan en su home correspondiente. Un menor sin autorización de acudiente no puede completar el registro.

---

## Fase 2 — Perfil del joven + directorio del empresario

**Objetivo:** cerrar el lado de la oferta (perfil del joven) y el descubrimiento (directorio para el empresario).

**Alcance:**
- **CRUD del perfil del joven** (`perfiles_joven`): formación, presentación, foto.
- **Habilidades etiquetables** desde el catálogo (`joven_habilidades`) — habilita los filtros del empresario.
- **Foto de perfil** vía Supabase Storage (con compresión al subir, ver consideraciones).
- **Estados de revisión**: `borrador → en_revision → aprobado / rechazado`.
- **Portafolio público** del joven (vista propia y vista como la ve el empresario, sin datos sensibles).
- **Directorio de talento** para el empresario: filtros por **habilidad**, **municipio** y disponibilidad; grid de tarjetas.
- **Botón de contacto** vía enlace `wa.me` (clic para chatear, sin API de pago).

**Tablas / RLS:** `perfiles_joven`, `joven_habilidades`, `habilidades`, `municipios`, Storage (bucket de fotos). RLS: joven edita solo su perfil; perfiles `aprobado` visibles a empresarios.

**Pantallas mockup:** 08 Crear perfil/portafolio · 09 Portafolio público · 10 Portafolio como lo ve el empresario · 11 Desktop perfil del joven · 12 Directorio de talento · 13 Desktop directorio (filtros + grid).

**Criterio de "hecho":** un joven completa su perfil y lo envía a revisión; una vez aprobado, un empresario lo encuentra filtrando por habilidad y municipio, y puede abrir un chat de WhatsApp.

---

## Fase 3 — Pop-ups y postulaciones

**Objetivo:** activar el núcleo del modelo: oportunidades por habilidad y postulación del joven.

**Alcance:**
- El **empresario publica un pop-up** (`popups`, estado `pendiente`) con habilidades requeridas (`popup_habilidades`).
- El **joven se postula** (`postulaciones`, único por par joven+popup).
- **Estados de postulación**: `enviada → vista → preseleccionado → contratado / descartado`.
- **Match**: jóvenes con habilidades coincidentes ven los pop-ups aprobados de su interés/municipio.
- Sugerencia de contacto vía `wa.me` cuando aplica (postulación enviada, pop-up nuevo).

**Tablas / RLS:** `popups`, `popup_habilidades`, `postulaciones`, `empresas`. RLS: empresario gestiona solo sus pop-ups; solo pop-ups `aprobado` son visibles a jóvenes.

**Pantallas mockup:** 14 Publicar pop-up · 15 Postulación al pop-up (joven) · 16 Desktop publicar pop-up (formulario + vista previa).

**Criterio de "hecho":** un empresario publica un pop-up; tras aprobación (Fase 4), un joven con la habilidad requerida lo ve y se postula; el empresario ve la postulación.

> Nota: la aprobación del pop-up depende de la Fase 4. En desarrollo se puede aprobar manualmente en BD para probar el flujo de postulación antes de tener el panel del líder.

---

## Fase 4 — Panel de aprobación (líder de área)

**Objetivo:** dar a la líder de área control de moderación **sin dependencia técnica**.

**Alcance:**
- **Cola de revisión** unificada: perfiles de joven `en_revision` + pop-ups `pendiente`.
- **Aprobar / rechazar** con registro de `revisado_por` y `fecha_revision`.
- UI **simple y guiada**: la líder opera sin necesitar soporte técnico para cada acción.

**Tablas / RLS:** `perfiles_joven`, `popups` (update por rol `lider`/`admin`).

**Pantallas mockup:** 17 Aprobación de contenido (líder) · 18 Desktop panel de aprobación.

**Criterio de "hecho":** la líder aprueba un perfil y un pop-up desde el panel; ambos pasan a ser visibles públicamente y quedan registrados quién y cuándo aprobó.

---

## Fase 5 — Contrataciones y seguimiento

**Objetivo:** cerrar el ciclo y capturar el resultado que alimenta los indicadores.

**Alcance:**
- El empresario marca una postulación como **`contratado`** → se crea el registro en `contrataciones`.
- **Seguimiento post-contratación**: ¿sigue vinculado? (`activo`), tiempo de permanencia (`fecha_inicio`, `fecha_ultimo_seguimiento`).
- Estos datos alimentan directamente el dashboard KPI (Fase 6).

**Tablas / RLS:** `contrataciones`, `postulaciones`.

**Pantallas mockup:** no hay pantalla dedicada en el mockup; se integra en el flujo de gestión de postulaciones del empresario y en el panel de la líder/admin.

**Criterio de "hecho":** al marcar un joven como contratado se crea la contratación y puede registrarse un seguimiento; el dato aparece disponible para el KPI.

---

## Fase 6 — Dashboard KPI (admin) + recursos educativos

**Objetivo:** entregar el valor institucional: medición para reportes y biblioteca de formación.

**Alcance:**
- **Dashboard KPI** basado en `vista_kpi_municipio`: jóvenes activos por municipio, empresarios registrados, pop-ups publicados, postulaciones, contrataciones activas, tasa de contratación comparativa por municipio.
- **Exportación CSV/PDF** (no solo visualización) para la Subcomisión de Concertación de Políticas Laborales y Salariales y financiadores.
- **Recursos educativos**: biblioteca de `recursos` (curso, webinar, taller, mentoría, cápsula, infografía) gestionada por líder/admin; **inscripción** del joven (`inscripciones`).

**Tablas / RLS:** `vista_kpi_municipio`, `recursos`, `inscripciones`. Ver consideración de `security definer` para agregados del admin.

**Pantallas mockup:** 19 Dashboard KPI (admin) · 20 Desktop dashboard KPI.

**Criterio de "hecho":** el admin ve los KPIs por municipio y exporta un CSV/PDF; un joven se inscribe a un recurso publicado por la líder.

---

## Fase 7 — Cierre para lanzamiento

**Objetivo:** requisitos que no bloquean el desarrollo pero **sí el lanzamiento**.

**Alcance:**
- **Validación jurídica** de `textos-legales-insercion-laboral.md`: en especial el mecanismo de autorización del acudiente y el consentimiento para publicar fotos de menores. Resolver los pendientes del propio documento (correo de contacto oficial, etc.).
- Páginas de **términos** y **política de privacidad** enlazadas desde el registro y el pie de página, antes de publicar datos personales en el directorio.
- **Optimización de datos**: auditoría de peso por página, compresión de imágenes, carga progresiva, lazy-loading — cumplir el requisito de bajo consumo en móvil de gama media.
- **Hardening de seguridad**: correr `get_advisors`, revisar todas las políticas RLS, y asegurar la política del bucket de Storage de fotos.
- **Pruebas de usuario** con jóvenes reales para validar comprensión (lenguaje sencillo, accesibilidad).

**Criterio de "hecho":** textos legales aprobados por jurídica y publicados; auditoría de seguridad sin hallazgos críticos; métricas de peso/carga dentro de objetivo mobile-first.

---

## Consideraciones y sugerencias

### Seguridad y RLS
- **Dashboard KPI:** la `vista_kpi_municipio` hereda RLS de las tablas base. Para que el admin vea agregados que cruzan datos que un usuario individual no puede ver, exponerla vía una **función `security definer`** que devuelva solo los agregados (no filas individuales).
- **Storage de fotos:** política del bucket que permita al joven subir/editar solo su propia foto, y lectura pública solo de fotos de perfiles `aprobado`.
- **Verificación continua:** correr `get_advisors` (seguridad y rendimiento) al cerrar cada fase que toque BD, no solo al final.

### Habeas Data y menores de edad
- El trigger `trg_validar_autorizacion_menor` ya bloquea en BD guardar un menor sin autorización de acudiente. La UI debe replicar el gate y **guardar los timestamps** (`fecha_autorizacion_datos`, `fecha_autorizacion_acudiente`) como evidencia.
- El **mecanismo de autorización del acudiente** (¿basta la casilla digital?, ¿requiere firma escaneada o confirmación por llamada?) es el mayor riesgo legal y debe definirse con jurídica antes de recibir menores en producción.

### Bajo consumo de datos / mobile-first
- **Comprimir imágenes al subir** (redimensionar + formato moderno tipo WebP/AVIF) antes de guardar en Storage; nunca servir la foto original de cámara.
- Lazy-loading y paginación en el directorio de talento (puede crecer a cientos de perfiles).
- Fuentes self-hosted con subconjunto de caracteres; evitar dependencias JS pesadas.
- Presupuesto de peso por página como métrica de la Fase 7.

### WhatsApp
- MVP: solo enlaces `wa.me` ("clic para chatear"), sin costo ni proveedor (BSP). La API de pago con notificaciones automáticas queda como mejora de fase posterior, sujeta a presupuesto institucional. **No integrar mensajería de pago sin pedido explícito.**

### Panel de líder sin dependencia técnica
- Priorizar formularios simples, textos guía y confirmaciones claras sobre flexibilidad técnica. La líder debe aprobar, rechazar y gestionar recursos sin depender del administrador para operaciones rutinarias.

### Datos de demo y QA
- Usar las fotos de `Perfiles Técnicos/` como seed de perfiles de ejemplo para pruebas y demostraciones, claramente marcados como **datos no reales**. Útiles para probar el directorio y los filtros antes de tener usuarios reales.

### Exportación del KPI
- CSV: generable en el cliente desde los datos de la vista. PDF: render de la vista del dashboard con una librería ligera (evitar dependencias grandes que contradigan el requisito de bajo peso).

### Estrategia de pruebas
- Probar el flujo **end-to-end por cada rol** (joven, empresario, líder, admin).
- Verificar explícitamente que **RLS niega accesos cruzados**: un joven no ve perfiles no aprobados de otros, un empresario no ve postulaciones de pop-ups ajenos, etc.

### Accesibilidad e idioma
- **Lenguaje sencillo** validado con usuarios (los textos de autorización pueden requerir simplificación según comprensión lectora).
- Contraste suficiente y objetivos táctiles amplios para móviles de gama media.

### Riesgos abiertos (a resolver antes de lanzar)
- Validación jurídica del mecanismo de autorización de menores — **bloqueante de lanzamiento**.
- Correo de contacto oficial del área (aparece como placeholder en los textos legales).
- Definición operativa de "disponibilidad" del joven (usada como filtro del directorio) — precisar qué significa y cómo se captura.

---

## Siguiente paso

Con este plan aprobado, la ejecución arranca por la **Fase 0** (cimientos técnicos): scaffold React + Vite, Tailwind con tokens, cliente Supabase y aplicación del esquema al proyecto `App Insercion Laboral`.
