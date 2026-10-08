-- ============================================================================
-- Proyectos destacados del portafolio del joven
-- Recomendación de las pruebas con usuarios: permitir que cada joven muestre
-- hasta unos pocos proyectos propios (título, descripción, enlace opcional).
-- Reejecutable: usa "if not exists" y recrea las políticas.
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
