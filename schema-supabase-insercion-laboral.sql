-- ============================================================================
-- PLATAFORMA DE INSERCIÓN LABORAL — Comité de Cafeteros de Caldas
-- Esquema SQL para Supabase (Postgres + RLS)
-- ============================================================================
-- Orden de ejecución: correr todo el archivo de una vez en el SQL Editor
-- de Supabase, o dividir por secciones si prefieres revisarlo por partes.
-- ============================================================================

-- Extensión necesaria para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABLAS DE CATÁLOGO
-- ============================================================================

create table municipios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table habilidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  categoria text
);

-- Nota: la RLS de estos catálogos se habilita más abajo (sección 2b), una vez
-- definida la función helper auth_rol() que usan sus políticas de escritura.

-- ============================================================================
-- 2. USUARIOS Y ROLES
-- ============================================================================
-- Extiende auth.users de Supabase. Cada usuario tiene una fila aquí
-- vinculada por auth_id.

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  rol text not null check (rol in ('joven','empresario','lider','admin')),
  nombre text not null,
  email text not null,
  municipio_id uuid references municipios(id),
  estado text not null default 'activo' check (estado in ('activo','inactivo','pendiente')),
  -- Habeas Data (Ley 1581 de 2012)
  autorizacion_datos boolean not null default false,
  fecha_autorizacion_datos timestamptz,
  es_menor_edad boolean not null default false,
  autorizacion_acudiente boolean not null default false,
  fecha_autorizacion_acudiente timestamptz,
  onboarding_completo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Trigger: bloquear autorización de menor sin autorización de acudiente
create or replace function validar_autorizacion_menor()
returns trigger
set search_path = public, pg_temp
as $$
begin
  if new.es_menor_edad = true and new.autorizacion_acudiente = false then
    raise exception 'Usuario menor de edad requiere autorización de acudiente antes de activarse';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_validar_autorizacion_menor
  before insert or update on usuarios
  for each row execute function validar_autorizacion_menor();

-- Funciones helper para RLS
-- SECURITY DEFINER es imprescindible: estas funciones se usan dentro de las
-- policies de `usuarios`; si leyeran `usuarios` con RLS, la policy volvería a
-- invocarlas y habría recursión infinita. Como definer, leen saltando RLS.
create or replace function auth_usuario_id()
returns uuid
security definer
set search_path = public, pg_temp
as $$
  select id from usuarios where auth_id = auth.uid();
$$ language sql stable;

create or replace function auth_rol()
returns text
security definer
set search_path = public, pg_temp
as $$
  select rol from usuarios where auth_id = auth.uid();
$$ language sql stable;

-- ============================================================================
-- 2b. RLS DE CATÁLOGOS (municipios, habilidades)
-- ============================================================================
-- Se define aquí, después de auth_rol(), porque las policies de escritura la usan.
-- Lectura para todos (necesaria en el registro, incluso sin sesión); escritura
-- solo para staff (lider/admin).

alter table municipios enable row level security;
create policy "municipios_select_todos" on municipios for select using (true);
create policy "municipios_modifica_staff" on municipios for all
  using (auth_rol() in ('lider','admin')) with check (auth_rol() in ('lider','admin'));

alter table habilidades enable row level security;
create policy "habilidades_select_todos" on habilidades for select using (true);
create policy "habilidades_modifica_staff" on habilidades for all
  using (auth_rol() in ('lider','admin')) with check (auth_rol() in ('lider','admin'));

alter table usuarios enable row level security;

create policy "usuarios_select_propio_o_staff"
  on usuarios for select
  using (auth_id = auth.uid() or auth_rol() in ('lider','admin'));

create policy "usuarios_insert_propio"
  on usuarios for insert
  with check (auth_id = auth.uid());

create policy "usuarios_update_propio_o_admin"
  on usuarios for update
  using (auth_id = auth.uid() or auth_rol() = 'admin');

-- ============================================================================
-- 3. PERFIL DEL JOVEN
-- ============================================================================

create table perfiles_joven (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references usuarios(id) on delete cascade,
  formacion text,
  presentacion text,
  foto_url text,
  telefono text,                          -- WhatsApp para contacto wa.me
  disponible boolean not null default true, -- disponible para pop-ups
  estado_revision text not null default 'borrador'
    check (estado_revision in ('borrador','en_revision','aprobado','rechazado')),
  revisado_por uuid references usuarios(id),
  fecha_revision timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table perfiles_joven enable row level security;

create policy "perfil_select_propio_aprobado_o_staff"
  on perfiles_joven for select
  using (
    usuario_id = auth_usuario_id()
    or estado_revision = 'aprobado'
    or auth_rol() in ('lider','admin')
  );

create policy "perfil_insert_propio_joven"
  on perfiles_joven for insert
  with check (usuario_id = auth_usuario_id() and auth_rol() = 'joven');

create policy "perfil_update_propio_o_staff"
  on perfiles_joven for update
  using (usuario_id = auth_usuario_id() or auth_rol() in ('lider','admin'));

-- Catálogo de habilidades del joven (muchos a muchos)
create table joven_habilidades (
  joven_id uuid not null references perfiles_joven(id) on delete cascade,
  habilidad_id uuid not null references habilidades(id) on delete cascade,
  primary key (joven_id, habilidad_id)
);

alter table joven_habilidades enable row level security;

create policy "joven_habilidades_select"
  on joven_habilidades for select
  using (
    exists (
      select 1 from perfiles_joven p
      where p.id = joven_id
      and (p.usuario_id = auth_usuario_id() or p.estado_revision = 'aprobado' or auth_rol() in ('lider','admin'))
    )
  );

create policy "joven_habilidades_modifica_propio"
  on joven_habilidades for all
  using (
    exists (
      select 1 from perfiles_joven p
      where p.id = joven_id and p.usuario_id = auth_usuario_id()
    )
  );

-- ============================================================================
-- 4. EMPRESAS
-- ============================================================================

create table empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null unique references usuarios(id) on delete cascade,
  nombre_empresa text not null,
  nit text,
  sector text,
  municipio_id uuid references municipios(id),
  created_at timestamptz not null default now()
);

alter table empresas enable row level security;

create policy "empresas_select_autenticados"
  on empresas for select
  using (auth.uid() is not null);

create policy "empresas_insert_propio"
  on empresas for insert
  with check (usuario_id = auth_usuario_id() and auth_rol() = 'empresario');

create policy "empresas_update_propio_o_admin"
  on empresas for update
  using (usuario_id = auth_usuario_id() or auth_rol() in ('lider','admin'));

-- ============================================================================
-- 5. POP-UPS DE CONTRATACIÓN
-- ============================================================================

create table popups (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  municipio_id uuid references municipios(id),
  cupos integer,
  pago_estimado text,
  fecha_inicio date,                      -- inicio del trabajo
  fecha_fin date,                         -- fin del trabajo
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobado','rechazado','cerrado')),
  revisado_por uuid references usuarios(id),
  fecha_publicacion timestamptz,
  fecha_cierre timestamptz,               -- cierre de postulaciones
  created_at timestamptz not null default now()
);

alter table popups enable row level security;

create policy "popups_select_aprobados_o_propio_o_staff"
  on popups for select
  using (
    estado = 'aprobado'
    or exists (select 1 from empresas e where e.id = empresa_id and e.usuario_id = auth_usuario_id())
    or auth_rol() in ('lider','admin')
  );

create policy "popups_insert_propio_empresario"
  on popups for insert
  with check (
    exists (select 1 from empresas e where e.id = empresa_id and e.usuario_id = auth_usuario_id())
  );

create policy "popups_update_propio_o_staff"
  on popups for update
  using (
    exists (select 1 from empresas e where e.id = empresa_id and e.usuario_id = auth_usuario_id())
    or auth_rol() in ('lider','admin')
  );

create table popup_habilidades (
  popup_id uuid not null references popups(id) on delete cascade,
  habilidad_id uuid not null references habilidades(id) on delete cascade,
  primary key (popup_id, habilidad_id)
);

alter table popup_habilidades enable row level security;

create policy "popup_habilidades_select"
  on popup_habilidades for select
  using (
    exists (
      select 1 from popups p
      where p.id = popup_id
      and (
        p.estado = 'aprobado'
        or exists (select 1 from empresas e where e.id = p.empresa_id and e.usuario_id = auth_usuario_id())
        or auth_rol() in ('lider','admin')
      )
    )
  );

create policy "popup_habilidades_modifica_propio"
  on popup_habilidades for all
  using (
    exists (
      select 1 from popups p
      join empresas e on e.id = p.empresa_id
      where p.id = popup_id and e.usuario_id = auth_usuario_id()
    )
  );

-- ============================================================================
-- 6. POSTULACIONES
-- ============================================================================

create table postulaciones (
  id uuid primary key default gen_random_uuid(),
  popup_id uuid not null references popups(id) on delete cascade,
  joven_id uuid not null references perfiles_joven(id) on delete cascade,
  estado text not null default 'enviada'
    check (estado in ('enviada','vista','preseleccionado','contratado','descartado')),
  created_at timestamptz not null default now(),
  unique (popup_id, joven_id)
);

alter table postulaciones enable row level security;

create policy "postulaciones_select_joven_o_empresa_o_staff"
  on postulaciones for select
  using (
    exists (select 1 from perfiles_joven p where p.id = joven_id and p.usuario_id = auth_usuario_id())
    or exists (
      select 1 from popups pu join empresas e on e.id = pu.empresa_id
      where pu.id = popup_id and e.usuario_id = auth_usuario_id()
    )
    or auth_rol() in ('lider','admin')
  );

create policy "postulaciones_insert_propio_joven"
  on postulaciones for insert
  with check (
    exists (select 1 from perfiles_joven p where p.id = joven_id and p.usuario_id = auth_usuario_id())
  );

create policy "postulaciones_update_empresa_o_staff"
  on postulaciones for update
  using (
    exists (
      select 1 from popups pu join empresas e on e.id = pu.empresa_id
      where pu.id = popup_id and e.usuario_id = auth_usuario_id()
    )
    or auth_rol() in ('lider','admin')
  );

-- ============================================================================
-- 7. CONTRATACIONES Y SEGUIMIENTO
-- ============================================================================

create table contrataciones (
  id uuid primary key default gen_random_uuid(),
  postulacion_id uuid not null unique references postulaciones(id) on delete cascade,
  fecha_inicio date not null,
  activo boolean not null default true,
  fecha_ultimo_seguimiento date,
  created_at timestamptz not null default now()
);

alter table contrataciones enable row level security;

create policy "contrataciones_select"
  on contrataciones for select
  using (
    exists (
      select 1 from postulaciones po
      join perfiles_joven pj on pj.id = po.joven_id
      where po.id = postulacion_id and pj.usuario_id = auth_usuario_id()
    )
    or exists (
      select 1 from postulaciones po
      join popups pu on pu.id = po.popup_id
      join empresas e on e.id = pu.empresa_id
      where po.id = postulacion_id and e.usuario_id = auth_usuario_id()
    )
    or auth_rol() in ('lider','admin')
  );

create policy "contrataciones_insert_update_empresa_o_staff"
  on contrataciones for all
  using (
    exists (
      select 1 from postulaciones po
      join popups pu on pu.id = po.popup_id
      join empresas e on e.id = pu.empresa_id
      where po.id = postulacion_id and e.usuario_id = auth_usuario_id()
    )
    or auth_rol() in ('lider','admin')
  );

-- ============================================================================
-- 8. RECURSOS EDUCATIVOS
-- ============================================================================

create table recursos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('curso','webinar','taller','mentoria','capsula','infografia')),
  titulo text not null,
  descripcion text,
  url_recurso text,
  fecha_publicacion date default current_date,
  creado_por uuid references usuarios(id),
  created_at timestamptz not null default now()
);

alter table recursos enable row level security;

create policy "recursos_select_autenticados"
  on recursos for select
  using (auth.uid() is not null);

create policy "recursos_modifica_staff"
  on recursos for all
  using (auth_rol() in ('lider','admin'));

create table inscripciones (
  id uuid primary key default gen_random_uuid(),
  recurso_id uuid not null references recursos(id) on delete cascade,
  joven_id uuid not null references perfiles_joven(id) on delete cascade,
  fecha timestamptz not null default now(),
  unique (recurso_id, joven_id)
);

alter table inscripciones enable row level security;

create policy "inscripciones_select_propio_o_staff"
  on inscripciones for select
  using (
    exists (select 1 from perfiles_joven p where p.id = joven_id and p.usuario_id = auth_usuario_id())
    or auth_rol() in ('lider','admin')
  );

create policy "inscripciones_insert_delete_propio"
  on inscripciones for all
  using (
    exists (select 1 from perfiles_joven p where p.id = joven_id and p.usuario_id = auth_usuario_id())
  );

-- ============================================================================
-- 9. ÍNDICES RECOMENDADOS (rendimiento en búsquedas y filtros frecuentes)
-- ============================================================================

create index idx_usuarios_rol on usuarios(rol);
create index idx_perfiles_joven_estado on perfiles_joven(estado_revision);
create index idx_popups_estado on popups(estado);
create index idx_postulaciones_popup on postulaciones(popup_id);
create index idx_postulaciones_joven on postulaciones(joven_id);
create index idx_empresas_municipio on empresas(municipio_id);
create index idx_usuarios_municipio on usuarios(municipio_id);
create index idx_popups_municipio on popups(municipio_id);

-- ============================================================================
-- 10. VISTA PARA DASHBOARD KPI (base de partida — ajustar según necesidad)
-- ============================================================================

-- security_invoker = on: la vista respeta la RLS del usuario que consulta
-- (no la del creador). Solo lider/admin, cuyas policies les permiten ver las
-- filas base, obtienen los agregados; el resto obtiene datos restringidos.
create view vista_kpi_municipio with (security_invoker = on) as
select
  m.nombre as municipio,
  count(distinct u.id) filter (where u.rol = 'joven' and u.estado = 'activo') as jovenes_activos,
  count(distinct e.id) as empresarios_registrados,
  count(distinct pu.id) filter (where pu.estado = 'aprobado') as popups_publicados,
  count(distinct po.id) as postulaciones_totales,
  count(distinct c.id) filter (where c.activo = true) as contrataciones_activas
from municipios m
left join usuarios u on u.municipio_id = m.id
left join empresas e on e.municipio_id = m.id
left join popups pu on pu.empresa_id = e.id
left join postulaciones po on po.popup_id = pu.id
left join contrataciones c on c.postulacion_id = po.id
group by m.nombre;

-- Nota: con security_invoker = on la vista aplica la RLS del usuario que la
-- consulta. Como las policies de las tablas base ya permiten a lider/admin ver
-- todas las filas, el dashboard funciona para ellos. Si más adelante se
-- necesitan agregados que crucen datos que ni admin puede ver fila por fila,
-- exponerlos vía una función security definer acotada.

-- ============================================================================
-- 11. CREACIÓN AUTOMÁTICA DEL PERFIL AL REGISTRARSE (integración con Auth)
-- ============================================================================
-- Cuando se registra un auth.users (supabase.auth.signUp), este trigger crea
-- automáticamente su fila en public.usuarios (y en empresas si es empresario),
-- leyendo los datos de raw_user_meta_data que envía el frontend. Es
-- SECURITY DEFINER para insertar saltando RLS; el trigger validar_autorizacion_menor
-- se sigue aplicando y bloquea el registro de menores sin autorización de acudiente.

create or replace function handle_new_user()
returns trigger
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario_id uuid;
  v_rol text;
  v_meta jsonb;
begin
  v_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_rol := v_meta->>'rol';

  -- Sin rol en el metadata (p. ej. usuario creado desde el panel de Supabase):
  -- no se crea perfil automáticamente.
  if v_rol is null then
    return new;
  end if;

  insert into public.usuarios (
    auth_id, rol, nombre, email, municipio_id,
    autorizacion_datos, fecha_autorizacion_datos,
    es_menor_edad, autorizacion_acudiente, fecha_autorizacion_acudiente
  ) values (
    new.id,
    v_rol,
    coalesce(v_meta->>'nombre', ''),
    new.email,
    nullif(v_meta->>'municipio_id', '')::uuid,
    coalesce((v_meta->>'autorizacion_datos')::boolean, false),
    case when (v_meta->>'autorizacion_datos')::boolean then now() else null end,
    coalesce((v_meta->>'es_menor_edad')::boolean, false),
    coalesce((v_meta->>'autorizacion_acudiente')::boolean, false),
    case when (v_meta->>'autorizacion_acudiente')::boolean then now() else null end
  )
  on conflict (auth_id) do nothing
  returning id into v_usuario_id;

  if v_rol = 'empresario' and v_usuario_id is not null then
    insert into public.empresas (usuario_id, nombre_empresa, nit, sector, municipio_id)
    values (
      v_usuario_id,
      coalesce(v_meta->>'nombre_empresa', ''),
      nullif(v_meta->>'nit', ''),
      nullif(v_meta->>'sector', ''),
      nullif(v_meta->>'municipio_id', '')::uuid
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- handle_new_user es función de trigger; no debe ser invocable como RPC.
revoke execute on function handle_new_user() from anon, authenticated, public;

-- ============================================================================
-- 12. STORAGE: FOTOS DE PERFIL (bucket público con RLS por dueño)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

-- Bucket público: las fotos se sirven por URL pública sin policy SELECT (no se
-- agrega policy de lectura para evitar que se pueda listar todo el bucket).
-- Escritura solo dentro de la carpeta del propio usuario (= su auth.uid()).
create policy "fotos_perfil_sube_propio" on storage.objects
  for insert with check (
    bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "fotos_perfil_actualiza_propio" on storage.objects
  for update using (
    bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "fotos_perfil_borra_propio" on storage.objects
  for delete using (
    bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 13. FUNCIONES DEL DIRECTORIO (empresario) — SECURITY DEFINER acotadas
-- ============================================================================
-- El directorio y la ficha pública muestran nombre y municipio del joven, que
-- viven en `usuarios` (RLS restringe a propio/staff). En vez de abrir esa RLS,
-- estas funciones exponen SOLO columnas públicas de perfiles APROBADOS y exigen
-- estar autenticado. Ejecutables solo por `authenticated`.

create or replace function buscar_directorio(
  p_busqueda text default null,
  p_habilidad uuid default null,
  p_municipio uuid default null,
  p_solo_disponibles boolean default false
)
returns table (
  usuario_id uuid,
  nombre text,
  municipio text,
  foto_url text,
  disponible boolean,
  habilidades jsonb
)
security definer
set search_path = public, pg_temp
language sql
stable
as $$
  select
    u.id,
    u.nombre,
    m.nombre,
    pj.foto_url,
    pj.disponible,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', h.id, 'nombre', h.nombre, 'categoria', h.categoria) order by h.nombre)
      from joven_habilidades jh join habilidades h on h.id = jh.habilidad_id
      where jh.joven_id = pj.id
    ), '[]'::jsonb)
  from perfiles_joven pj
  join usuarios u on u.id = pj.usuario_id
  left join municipios m on m.id = u.municipio_id
  where (select auth.uid()) is not null
    and pj.estado_revision = 'aprobado'
    and (p_municipio is null or u.municipio_id = p_municipio)
    and (not p_solo_disponibles or pj.disponible = true)
    and (p_habilidad is null or exists (
      select 1 from joven_habilidades jh where jh.joven_id = pj.id and jh.habilidad_id = p_habilidad))
    and (
      p_busqueda is null or p_busqueda = '' or
      u.nombre ilike '%' || p_busqueda || '%' or
      exists (
        select 1 from joven_habilidades jh join habilidades h on h.id = jh.habilidad_id
        where jh.joven_id = pj.id and h.nombre ilike '%' || p_busqueda || '%')
    )
  order by pj.disponible desc, u.nombre;
$$;

revoke execute on function buscar_directorio(text, uuid, uuid, boolean) from anon, public;
grant execute on function buscar_directorio(text, uuid, uuid, boolean) to authenticated;

create or replace function obtener_perfil_publico(p_usuario_id uuid)
returns table (
  usuario_id uuid,
  nombre text,
  municipio text,
  presentacion text,
  formacion text,
  foto_url text,
  telefono text,
  disponible boolean,
  estado_revision text,
  habilidades jsonb
)
security definer
set search_path = public, pg_temp
language sql
stable
as $$
  select
    u.id,
    u.nombre,
    m.nombre,
    pj.presentacion,
    pj.formacion,
    pj.foto_url,
    pj.telefono,
    pj.disponible,
    pj.estado_revision,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', h.id, 'nombre', h.nombre, 'categoria', h.categoria) order by h.nombre)
      from joven_habilidades jh join habilidades h on h.id = jh.habilidad_id
      where jh.joven_id = pj.id
    ), '[]'::jsonb)
  from perfiles_joven pj
  join usuarios u on u.id = pj.usuario_id
  left join municipios m on m.id = u.municipio_id
  where (select auth.uid()) is not null
    and u.id = p_usuario_id
    and (
      pj.estado_revision = 'aprobado'
      or pj.usuario_id = auth_usuario_id()
      or auth_rol() in ('lider', 'admin')
    );
$$;

revoke execute on function obtener_perfil_publico(uuid) from anon, public;
grant execute on function obtener_perfil_publico(uuid) to authenticated;

-- Postulantes de un pop-up (vista del empresario). Mismo criterio: el nombre y
-- municipio del joven viven en `usuarios`, así que se exponen aquí solo columnas
-- públicas y solo al dueño del pop-up o a staff.
create or replace function listar_postulaciones_popup(p_popup_id uuid)
returns table (
  postulacion_id uuid,
  estado text,
  fecha timestamptz,
  usuario_id uuid,
  nombre text,
  municipio text,
  foto_url text,
  telefono text,
  habilidades jsonb
)
security definer
set search_path = public, pg_temp
language sql
stable
as $$
  select
    po.id,
    po.estado,
    po.created_at,
    u.id,
    u.nombre,
    m.nombre,
    pj.foto_url,
    pj.telefono,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', h.id, 'nombre', h.nombre) order by h.nombre)
      from joven_habilidades jh join habilidades h on h.id = jh.habilidad_id
      where jh.joven_id = pj.id
    ), '[]'::jsonb)
  from postulaciones po
  join perfiles_joven pj on pj.id = po.joven_id
  join usuarios u on u.id = pj.usuario_id
  left join municipios m on m.id = u.municipio_id
  where (select auth.uid()) is not null
    and po.popup_id = p_popup_id
    and (
      exists (
        select 1 from popups pu
        join empresas e on e.id = pu.empresa_id
        where pu.id = p_popup_id and e.usuario_id = auth_usuario_id()
      )
      or auth_rol() in ('lider', 'admin')
    )
  order by po.created_at desc;
$$;

revoke execute on function listar_postulaciones_popup(uuid) from anon, public;
grant execute on function listar_postulaciones_popup(uuid) to authenticated;

-- ============================================================================
-- 12. PROYECTOS DESTACADOS DEL PORTAFOLIO
-- (migración equivalente en supabase/migrations/20261007000000_proyectos_destacados.sql)
-- ============================================================================

create table if not exists proyectos_joven (
  id uuid primary key default gen_random_uuid(),
  joven_id uuid not null references perfiles_joven(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 120),
  descripcion text check (descripcion is null or char_length(descripcion) <= 600),
  enlace text check (enlace is null or char_length(enlace) <= 500),
  anio int check (anio is null or anio between 1990 and 2100),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_proyectos_joven_joven on proyectos_joven(joven_id);

alter table proyectos_joven enable row level security;

-- Lectura: el propio joven, cualquiera con sesión si el perfil está aprobado
-- (mismo criterio que el directorio), y el personal del Comité.
drop policy if exists "proyectos_select" on proyectos_joven;
create policy "proyectos_select"
  on proyectos_joven for select
  to authenticated
  using (
    exists (
      select 1 from perfiles_joven p
      where p.id = joven_id
        and (p.usuario_id = auth_usuario_id() or p.estado_revision = 'aprobado')
    )
    or auth_rol() in ('lider', 'admin')
  );

-- Escritura: solo el dueño del perfil.
drop policy if exists "proyectos_modifica_propio" on proyectos_joven;
create policy "proyectos_modifica_propio"
  on proyectos_joven for all
  to authenticated
  using (
    exists (select 1 from perfiles_joven p where p.id = joven_id and p.usuario_id = auth_usuario_id())
  )
  with check (
    exists (select 1 from perfiles_joven p where p.id = joven_id and p.usuario_id = auth_usuario_id())
  );

-- ============================================================================
-- 14. ENDURECIMIENTO DE SEGURIDAD
-- (migración equivalente: supabase/migrations/20261007000100_endurecer_seguridad.sql)
-- Cierra brechas donde la RLS sola dejaba escalar privilegios o saltarse la
-- moderación desde la API: registro con rol privilegiado, edición del propio
-- rol/estado, auto-aprobación de perfiles y pop-ups, postulaciones con estado
-- forzado y lectura anónima de perfiles/pop-ups aprobados.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Registro: solo se pueden crear cuentas de joven o empresario
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario_id uuid;
  v_rol text;
  v_meta jsonb;
begin
  v_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_rol := v_meta->>'rol';

  -- Sin rol, o con un rol que no es de autoservicio (lider/admin se asignan
  -- solo desde el panel de administración), no se crea perfil automáticamente.
  if v_rol is null or v_rol not in ('joven', 'empresario') then
    return new;
  end if;

  insert into public.usuarios (
    auth_id, rol, nombre, email, municipio_id,
    autorizacion_datos, fecha_autorizacion_datos,
    es_menor_edad, autorizacion_acudiente, fecha_autorizacion_acudiente
  ) values (
    new.id,
    v_rol,
    coalesce(v_meta->>'nombre', ''),
    new.email,
    nullif(v_meta->>'municipio_id', '')::uuid,
    coalesce((v_meta->>'autorizacion_datos')::boolean, false),
    case when (v_meta->>'autorizacion_datos')::boolean then now() else null end,
    coalesce((v_meta->>'es_menor_edad')::boolean, false),
    coalesce((v_meta->>'autorizacion_acudiente')::boolean, false),
    case when (v_meta->>'autorizacion_acudiente')::boolean then now() else null end
  )
  on conflict (auth_id) do nothing
  returning id into v_usuario_id;

  if v_rol = 'empresario' and v_usuario_id is not null then
    insert into public.empresas (usuario_id, nombre_empresa, nit, sector, municipio_id)
    values (
      v_usuario_id,
      coalesce(v_meta->>'nombre_empresa', ''),
      nullif(v_meta->>'nit', ''),
      nullif(v_meta->>'sector', ''),
      nullif(v_meta->>'municipio_id', '')::uuid
    );
  end if;

  return new;
end;
$$ language plpgsql;

revoke execute on function handle_new_user() from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- 2. usuarios: rol, estado y evidencia de autorizaciones no se editan solos
-- ---------------------------------------------------------------------------
create or replace function proteger_usuarios()
returns trigger
set search_path = public, pg_temp
as $$
begin
  -- Mantenimiento (sin sesión de usuario): sin restricciones.
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.rol not in ('joven', 'empresario') then
      raise exception 'Rol no permitido para el autorregistro' using errcode = '42501';
    end if;
    new.estado := 'activo';
    return new;
  end if;

  -- UPDATE: el admin puede todo; el resto no toca rol, estado ni evidencias.
  if coalesce(auth_rol(), '') = 'admin' then
    return new;
  end if;

  if new.rol is distinct from old.rol
     or new.estado is distinct from old.estado
     or new.auth_id is distinct from old.auth_id
     or new.es_menor_edad is distinct from old.es_menor_edad
     or new.autorizacion_acudiente is distinct from old.autorizacion_acudiente
     or new.fecha_autorizacion_acudiente is distinct from old.fecha_autorizacion_acudiente
     or new.fecha_autorizacion_datos is distinct from old.fecha_autorizacion_datos
  then
    raise exception 'No tienes permiso para modificar estos datos de la cuenta' using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_usuarios on usuarios;
create trigger trg_proteger_usuarios
  before insert or update on usuarios
  for each row execute function proteger_usuarios();

-- ---------------------------------------------------------------------------
-- 3a. perfiles_joven: el joven no se aprueba a sí mismo
-- ---------------------------------------------------------------------------
create or replace function proteger_perfiles_joven()
returns trigger
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or coalesce(auth_rol(), '') in ('lider', 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.estado_revision not in ('borrador', 'en_revision') then
      raise exception 'Un perfil nuevo solo puede quedar en borrador o en revisión' using errcode = '42501';
    end if;
    new.revisado_por := null;
    new.fecha_revision := null;
    return new;
  end if;

  if new.estado_revision is distinct from old.estado_revision
     and new.estado_revision not in ('borrador', 'en_revision') then
    raise exception 'Solo el equipo de Inserción Laboral puede aprobar o rechazar un perfil' using errcode = '42501';
  end if;

  new.usuario_id := old.usuario_id;
  new.revisado_por := old.revisado_por;
  new.fecha_revision := old.fecha_revision;

  -- Si cambia el contenido visible de un perfil aprobado, vuelve a revisión.
  if old.estado_revision = 'aprobado' and new.estado_revision = 'aprobado'
     and (new.presentacion is distinct from old.presentacion
          or new.formacion is distinct from old.formacion
          or new.foto_url is distinct from old.foto_url) then
    new.estado_revision := 'en_revision';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_perfiles_joven on perfiles_joven;
create trigger trg_proteger_perfiles_joven
  before insert or update on perfiles_joven
  for each row execute function proteger_perfiles_joven();

-- ---------------------------------------------------------------------------
-- 3b. popups: el empresario no publica sin aprobación
-- ---------------------------------------------------------------------------
create or replace function proteger_popups()
returns trigger
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or coalesce(auth_rol(), '') in ('lider', 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'pendiente';
    new.revisado_por := null;
    new.fecha_publicacion := null;
    return new;
  end if;

  if new.estado is distinct from old.estado
     and not (old.estado in ('pendiente', 'aprobado') and new.estado = 'cerrado') then
    raise exception 'Solo el equipo de Inserción Laboral puede aprobar o rechazar un pop-up' using errcode = '42501';
  end if;

  new.empresa_id := old.empresa_id;
  new.revisado_por := old.revisado_por;
  new.fecha_publicacion := old.fecha_publicacion;

  -- Si cambia el contenido de un pop-up aprobado, vuelve a revisión.
  if old.estado = 'aprobado' and new.estado = 'aprobado'
     and (new.titulo is distinct from old.titulo
          or new.descripcion is distinct from old.descripcion
          or new.municipio_id is distinct from old.municipio_id
          or new.cupos is distinct from old.cupos
          or new.pago_estimado is distinct from old.pago_estimado
          or new.fecha_inicio is distinct from old.fecha_inicio
          or new.fecha_fin is distinct from old.fecha_fin) then
    new.estado := 'pendiente';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_popups on popups;
create trigger trg_proteger_popups
  before insert or update on popups
  for each row execute function proteger_popups();

-- ---------------------------------------------------------------------------
-- 4. postulaciones: siempre nacen "enviada", solo a pop-ups abiertos
-- ---------------------------------------------------------------------------
create or replace function proteger_postulaciones()
returns trigger
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or coalesce(auth_rol(), '') in ('lider', 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.estado := 'enviada';
    if not exists (
      select 1 from popups pu
      where pu.id = new.popup_id
        and pu.estado = 'aprobado'
        and (pu.fecha_cierre is null or pu.fecha_cierre > now())
    ) then
      raise exception 'Este pop-up no está recibiendo postulaciones' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.popup_id is distinct from old.popup_id or new.joven_id is distinct from old.joven_id then
    raise exception 'No se puede cambiar el pop-up ni la persona de una postulación' using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_postulaciones on postulaciones;
create trigger trg_proteger_postulaciones
  before insert or update on postulaciones
  for each row execute function proteger_postulaciones();

-- ---------------------------------------------------------------------------
-- 4b. contrataciones: solo sobre postulaciones marcadas como contratadas
-- ---------------------------------------------------------------------------
create or replace function proteger_contrataciones()
returns trigger
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or coalesce(auth_rol(), '') in ('lider', 'admin') then
    return new;
  end if;

  if tg_op = 'INSERT' and not exists (
    select 1 from postulaciones po where po.id = new.postulacion_id and po.estado = 'contratado'
  ) then
    raise exception 'Primero marca la postulación como contratada' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' then
    new.postulacion_id := old.postulacion_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_contrataciones on contrataciones;
create trigger trg_proteger_contrataciones
  before insert or update on contrataciones
  for each row execute function proteger_contrataciones();

-- ---------------------------------------------------------------------------
-- 5. empresas: solo un usuario con rol empresario puede crear la suya
-- ---------------------------------------------------------------------------
drop policy if exists "empresas_insert_propio" on empresas;
create policy "empresas_insert_propio"
  on empresas for insert
  with check (usuario_id = auth_usuario_id() and auth_rol() = 'empresario');

-- ---------------------------------------------------------------------------
-- 6. Lectura solo con sesión iniciada
--    Sin esto, cualquier visitante anónimo (con la clave pública del sitio)
--    podía consultar por la API los perfiles aprobados —incluido el teléfono—
--    y los pop-ups aprobados. El directorio exige sesión; las tablas también.
-- ---------------------------------------------------------------------------
drop policy if exists "perfil_select_propio_aprobado_o_staff" on perfiles_joven;
create policy "perfil_select_propio_aprobado_o_staff"
  on perfiles_joven for select
  to authenticated
  using (
    usuario_id = auth_usuario_id()
    or estado_revision = 'aprobado'
    or auth_rol() in ('lider', 'admin')
  );

drop policy if exists "joven_habilidades_select" on joven_habilidades;
create policy "joven_habilidades_select"
  on joven_habilidades for select
  to authenticated
  using (
    exists (
      select 1 from perfiles_joven p
      where p.id = joven_id
        and (p.usuario_id = auth_usuario_id() or p.estado_revision = 'aprobado' or auth_rol() in ('lider', 'admin'))
    )
  );

drop policy if exists "popups_select_aprobados_o_propio_o_staff" on popups;
create policy "popups_select_aprobados_o_propio_o_staff"
  on popups for select
  to authenticated
  using (
    estado = 'aprobado'
    or exists (select 1 from empresas e where e.id = empresa_id and e.usuario_id = auth_usuario_id())
    or auth_rol() in ('lider', 'admin')
  );

drop policy if exists "popup_habilidades_select" on popup_habilidades;
create policy "popup_habilidades_select"
  on popup_habilidades for select
  to authenticated
  using (
    exists (
      select 1 from popups p
      where p.id = popup_id
        and (
          p.estado = 'aprobado'
          or exists (select 1 from empresas e where e.id = p.empresa_id and e.usuario_id = auth_usuario_id())
          or auth_rol() in ('lider', 'admin')
        )
    )
  );

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
