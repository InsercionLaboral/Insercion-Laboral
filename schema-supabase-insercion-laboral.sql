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
create or replace function auth_usuario_id()
returns uuid
set search_path = public, pg_temp
as $$
  select id from usuarios where auth_id = auth.uid();
$$ language sql stable;

create or replace function auth_rol()
returns text
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
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobado','rechazado','cerrado')),
  revisado_por uuid references usuarios(id),
  fecha_publicacion timestamptz,
  fecha_cierre timestamptz,
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

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
