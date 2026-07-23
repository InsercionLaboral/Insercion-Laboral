# Plataforma de Inserción Laboral — Comité de Cafeteros de Caldas

Conecta jóvenes egresados de *La Universidad en el Campo* con empresarios de Caldas
mediante contratación por habilidades ("pop-ups"), recursos de formación y seguimiento
de resultados.

- **Stack:** React + Vite · Tailwind CSS · Supabase (Postgres + Auth + RLS + Storage) · Vercel.
- **Planeación:** ver [planeacion-plataforma-insercion-laboral.md](planeacion-plataforma-insercion-laboral.md) (alcance funcional) y [fases-implementacion-insercion-laboral.md](fases-implementacion-insercion-laboral.md) (hoja de ruta por fases). Estado: **Fase 0 completada** (cimientos técnicos).

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

`.env` está en `.gitignore` — nunca se commitea.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite). |
| `npm run build` | Build de producción a `dist/`. |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run lint` | ESLint sobre `src/`. |

## Base de datos (Supabase)

El esquema y los catálogos ya están aplicados al proyecto. Para recrearlos en un proyecto nuevo, correr en el SQL Editor **en este orden**:

1. [schema-supabase-insercion-laboral.sql](schema-supabase-insercion-laboral.sql) — tablas, RLS, funciones, trigger, vista KPI.
2. [catalogo-habilidades-insercion-laboral.sql](catalogo-habilidades-insercion-laboral.sql) — seed de habilidades.
3. Sembrar `municipios` con los 27 municipios de Caldas.

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
  index.css                Tailwind v4 + tokens de paleta/tipografías
  styles/fonts.css         @font-face self-hosted (woff2 en /public/fonts)
  lib/
    supabase.js            Cliente Supabase
    database.types.ts      Tipos generados del esquema (referencia)
  auth/
    AuthProvider.jsx       Sesión + fila de usuario (rol) en contexto
    ProtectedRoute.jsx     Rutas protegidas por sesión y rol
  constants/roles.js       Roles y home por rol
  routes/index.jsx         Esqueleto de rutas
  layouts/AppLayout.jsx    Shell mobile-first autenticado
  components/Cargando.jsx  Indicador de carga
  pages/                   Landing + placeholders por fase
public/
  fonts/                   Fuentes woff2 self-hosted
  assets/logo.jpg          Logo institucional
```

> Nota: los archivos `Flujo Joven.dc.html`, `support.js` y `assets/`, `uploads/` en la raíz
> son insumos de diseño (mockup de Claude Design) y de planeación, no parte del build.
