# Plataforma de Inserción Laboral — Comité de Cafeteros de Caldas

Conecta jóvenes egresados de *La Universidad en el Campo* con empresarios de Caldas
mediante contratación por habilidades ("pop-ups"), recursos de formación y seguimiento
de resultados.

- **Stack:** React + Vite · Tailwind CSS · Supabase (Postgres + Auth + RLS + Storage) · Vercel.
- **Planeación:** ver [planeacion-plataforma-insercion-laboral.md](planeacion-plataforma-insercion-laboral.md) (alcance funcional) y [fases-implementacion-insercion-laboral.md](fases-implementacion-insercion-laboral.md) (hoja de ruta por fases). Estado: **fases 0 a 6 implementadas y migraciones aplicadas**; textos legales aprobados y correo oficial de contacto `edurural.giraldo.lucelly@gmail.com`. Para el lanzamiento faltan el SMTP propio en Supabase, fijar el mínimo de contraseña y las pruebas con jóvenes.

## Requisitos

- Node.js 20+ y npm 10+.
- Un proyecto de Supabase (este repo apunta a **`App Insercion Laboral`**, id `ofcnxaxqqcpbahkwnljk`).

## Puesta en marcha (local)

```bash
npm install
cp .env.example .env   # y completa las claves (ver abajo)
npm run dev            # http://localhost:5173
```

### Variables de entorno

Copia `.env.example` a `.env` y define:

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (`https://ofcnxaxqqcpbahkwnljk.supabase.co`). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publishable (`sb_publishable_…`). Es segura para el frontend: el acceso lo controla RLS. |
| `VITE_CORREO_CONTACTO` | (Opcional) Correo oficial del área; si no se define se usa `edurural.giraldo.lucelly@gmail.com`. Aparece en términos, privacidad y Mi cuenta. |

`.env` está en `.gitignore` — nunca se commitea.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite). |
| `npm run build` | Build de producción a `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run lint` | ESLint. |

## Base de datos (Supabase)

El esquema y los catálogos ya están aplicados al proyecto. Para recrearlos en un proyecto nuevo, correr en el SQL Editor **en este orden**:

1. [schema-supabase-insercion-laboral.sql](schema-supabase-insercion-laboral.sql) — tablas, RLS, funciones, trigger, vista KPI.
2. [catalogo-habilidades-insercion-laboral.sql](catalogo-habilidades-insercion-laboral.sql) — seed de habilidades.
3. Sembrar `municipios` con los 27 municipios de Caldas.

El `.sql` del esquema ya incluye todo lo posterior (proyectos destacados y endurecimiento de seguridad). En un proyecto **ya existente** basta con correr, en este orden, los archivos de [supabase/migrations/](supabase/migrations/) en orden: `20261007000000_proyectos_destacados.sql`, `20261007000100_endurecer_seguridad.sql` y `20261008000000_funciones_lanzamiento.sql` (todos reejecutables). `supabase/mantenimiento/limpiar-datos-prueba.sql` retira las cuentas de prueba y demo. Después correr los avisos de seguridad de Supabase y regenerar los tipos.

Los tipos TypeScript del esquema están en [src/lib/database.types.ts](src/lib/database.types.ts) (regenerar tras cambios en la BD).

## Despliegue en Vercel

El repositorio ya incluye [vercel.json](vercel.json) (framework `vite` + rewrite SPA para React Router).

1. En Vercel, **Add New → Project** e importa este repositorio (requiere haberlo subido a un remoto Git).
2. Vercel detecta Vite automáticamente (`build` → `dist/`).
3. En **Settings → Environment Variables**, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (para Production y Preview).
4. **Deploy**. Cada push genera un preview; `main` va a producción.

## Estructura

```
src/
  main.jsx                 Punto de entrada (Router + AuthProvider)
  config.js                Correo de contacto y marca de textos legales validados
  index.css                Tailwind v4 + tokens + estilos de impresión (reporte PDF)
  routes/index.jsx         Rutas con carga diferida por pantalla
  auth/                    Sesión/rol (AuthProvider), rutas protegidas y redirección por rol
  layouts/                 AppLayout (menú por rol) y AuthShell (acceso)
  lib/                     Capa de datos (una función por consulta): perfil, popups,
                           contrataciones, recursos, kpi (indicadores + CSV), usuarios,
                           proyectos, aprobaciones, auth, edad, fechas, whatsapp, imagen
  hooks/                   Catálogos con reintento y caché local (municipios, habilidades)
  components/              Piezas compartidas (ui/ = primitivas)
  pages/
    joven/                 Inicio, perfil, portafolio, pop-ups, recursos
    empresario/            Directorio, talento, pop-ups, contratados
    lider/                 Aprobaciones, seguimiento, recursos, historial
    admin/                 Indicadores y usuarios
supabase/migrations/       Cambios de base de datos posteriores al esquema base
public/                    Fuentes woff2 self-hosted y logo
docs/manuales/             Manuales de usuario (PDF) por rol
```

> Nota: los archivos `Flujo Joven.dc.html`, `support.js` y `assets/`, `uploads/` en la raíz
> son insumos de diseño (mockup de Claude Design) y de planeación, no parte del build.
