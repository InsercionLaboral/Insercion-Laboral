-- ============================================================================
-- Funciones para el lanzamiento (oct-2026). Requiere 20261007000100.
--   1. Motivo al rechazar perfiles y pop-ups (lo escribe el líder; lo ve el dueño).
--   2. Un pop-up rechazado se puede corregir y reenviar a revisión.
--   3. Avisos dentro de la plataforma (tabla notificaciones + disparadores).
--   4. Directorio por páginas (p_limite / p_desplazamiento).
--   5. El administrador puede restablecer la contraseña de una cuenta.
-- Reejecutable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Motivo de revisión
-- ---------------------------------------------------------------------------
alter table perfiles_joven add column if not exists motivo_revision text
  check (motivo_revision is null or char_length(motivo_revision) <= 500);
alter table popups add column if not exists motivo_revision text
  check (motivo_revision is null or char_length(motivo_revision) <= 500);

-- Protección de perfiles: además de lo anterior, el motivo solo lo escribe el personal.
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
    new.motivo_revision := null;
    return new;
  end if;

  if new.estado_revision is distinct from old.estado_revision
     and new.estado_revision not in ('borrador', 'en_revision') then
    raise exception 'Solo el equipo de Inserción Laboral puede aprobar o rechazar un perfil' using errcode = '42501';
  end if;

  new.usuario_id := old.usuario_id;
  new.revisado_por := old.revisado_por;
  new.fecha_revision := old.fecha_revision;
  new.motivo_revision := old.motivo_revision;

  if old.estado_revision = 'aprobado' and new.estado_revision = 'aprobado'
     and (new.presentacion is distinct from old.presentacion
          or new.formacion is distinct from old.formacion
          or new.foto_url is distinct from old.foto_url) then
    new.estado_revision := 'en_revision';
  end if;

  return new;
end;
$$ language plpgsql;

-- Protección de pop-ups: el motivo lo escribe el personal; el dueño puede devolver a
-- revisión un pop-up rechazado (tras corregirlo) o publicado (tras editarlo).
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
    new.motivo_revision := null;
    return new;
  end if;

  if new.estado is distinct from old.estado
     and not (old.estado in ('pendiente', 'aprobado') and new.estado = 'cerrado')
     and not (old.estado in ('rechazado', 'aprobado') and new.estado = 'pendiente') then
    raise exception 'Solo el equipo de Inserción Laboral puede aprobar o rechazar un pop-up' using errcode = '42501';
  end if;

  new.empresa_id := old.empresa_id;
  new.revisado_por := old.revisado_por;
  new.fecha_publicacion := old.fecha_publicacion;
  new.motivo_revision := old.motivo_revision;

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

-- ---------------------------------------------------------------------------
-- 3. Avisos dentro de la plataforma
-- ---------------------------------------------------------------------------
create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensaje text,
  enlace text,                 -- ruta interna de la app (ej. /joven/popups/<id>)
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notificaciones_usuario on notificaciones(usuario_id, leida, created_at desc);

alter table notificaciones enable row level security;

drop policy if exists "notificaciones_select_propio" on notificaciones;
create policy "notificaciones_select_propio" on notificaciones for select to authenticated
  using (usuario_id = auth_usuario_id());

drop policy if exists "notificaciones_update_propio" on notificaciones;
create policy "notificaciones_update_propio" on notificaciones for update to authenticated
  using (usuario_id = auth_usuario_id()) with check (usuario_id = auth_usuario_id());

drop policy if exists "notificaciones_delete_propio" on notificaciones;
create policy "notificaciones_delete_propio" on notificaciones for delete to authenticated
  using (usuario_id = auth_usuario_id());
-- Sin política de INSERT: solo las crean los disparadores (security definer).

-- La persona solo puede marcar como leída; no reescribir el contenido.
create or replace function proteger_notificaciones()
returns trigger
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  new.usuario_id := old.usuario_id;
  new.tipo := old.tipo;
  new.titulo := old.titulo;
  new.mensaje := old.mensaje;
  new.enlace := old.enlace;
  new.created_at := old.created_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_proteger_notificaciones on notificaciones;
create trigger trg_proteger_notificaciones
  before update on notificaciones
  for each row execute function proteger_notificaciones();

-- Ayudantes (solo para uso interno de los disparadores)
create or replace function notificar(p_usuario uuid, p_tipo text, p_titulo text, p_mensaje text, p_enlace text)
returns void
security definer
set search_path = public, pg_temp
language plpgsql
as $$
begin
  if p_usuario is null then
    return;
  end if;
  insert into notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
  values (p_usuario, p_tipo, p_titulo, p_mensaje, p_enlace);
end;
$$;

create or replace function notificar_personal(p_tipo text, p_titulo text, p_mensaje text, p_enlace text)
returns void
security definer
set search_path = public, pg_temp
language plpgsql
as $$
begin
  insert into notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
  select u.id, p_tipo, p_titulo, p_mensaje, p_enlace
  from usuarios u
  where u.rol in ('lider', 'admin') and u.estado = 'activo';
end;
$$;

revoke execute on function notificar(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function notificar_personal(text, text, text, text) from public, anon, authenticated;

-- Perfiles: aviso al joven cuando lo revisan; al personal cuando llega uno a revisión.
create or replace function avisar_perfil()
returns trigger
security definer
set search_path = public, pg_temp
language plpgsql
as $$
declare
  v_nombre text;
begin
  begin
    if tg_op = 'UPDATE' and new.estado_revision is not distinct from old.estado_revision then
      return new;
    end if;
    if new.estado_revision = 'aprobado' then
      perform notificar(new.usuario_id, 'perfil_aprobado', '¡Tu perfil fue aprobado!',
        'Ya apareces en el directorio de talento. Los empresarios pueden encontrarte.', '/joven/portafolio');
    elsif new.estado_revision = 'rechazado' then
      perform notificar(new.usuario_id, 'perfil_rechazado', 'Tu perfil necesita cambios',
        coalesce(new.motivo_revision, 'Revisa tu perfil, ajústalo y envíalo de nuevo.'), '/joven/perfil');
    elsif new.estado_revision = 'en_revision' then
      select nombre into v_nombre from usuarios where id = new.usuario_id;
      perform notificar_personal('perfil_por_revisar', 'Nuevo perfil por revisar',
        coalesce(v_nombre, 'Un joven') || ' envió su perfil a revisión.', '/lider');
    end if;
  exception when others then
    raise warning 'avisar_perfil: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_avisar_perfil on perfiles_joven;
create trigger trg_avisar_perfil
  after insert or update of estado_revision on perfiles_joven
  for each row execute function avisar_perfil();

-- Pop-ups: aviso al empresario cuando lo revisan, al personal cuando hay uno pendiente,
-- y a los jóvenes con alguna habilidad pedida cuando se publica.
create or replace function avisar_popup()
returns trigger
security definer
set search_path = public, pg_temp
language plpgsql
as $$
declare
  v_dueno uuid;
begin
  begin
    if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
      return new;
    end if;
    select e.usuario_id into v_dueno from empresas e where e.id = new.empresa_id;

    if new.estado = 'pendiente' then
      perform notificar_personal('popup_por_revisar', 'Nuevo pop-up por revisar',
        '“' || new.titulo || '” espera tu revisión.', '/lider');
    elsif new.estado = 'aprobado' then
      perform notificar(v_dueno, 'popup_aprobado', 'Tu pop-up fue publicado',
        '“' || new.titulo || '” ya lo pueden ver los jóvenes.', '/empresario/popups/' || new.id);
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
      select distinct pj.usuario_id, 'popup_nuevo', 'Nueva oportunidad para ti',
             '“' || new.titulo || '” busca habilidades que tú tienes.', '/joven/popups/' || new.id
      from perfiles_joven pj
      join usuarios u on u.id = pj.usuario_id and u.estado = 'activo'
      join joven_habilidades jh on jh.joven_id = pj.id
      join popup_habilidades ph on ph.habilidad_id = jh.habilidad_id and ph.popup_id = new.id
      where pj.estado_revision = 'aprobado' and pj.disponible = true;
    elsif new.estado = 'rechazado' then
      perform notificar(v_dueno, 'popup_rechazado', 'Tu pop-up no fue publicado',
        coalesce(new.motivo_revision, 'Revisa la oportunidad, ajústala y envíala de nuevo.'), '/empresario/popups/' || new.id);
    end if;
  exception when others then
    raise warning 'avisar_popup: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_avisar_popup on popups;
create trigger trg_avisar_popup
  after insert or update of estado on popups
  for each row execute function avisar_popup();

-- Postulaciones: aviso al empresario cuando llega una; al joven cuando cambia su estado.
create or replace function avisar_postulacion()
returns trigger
security definer
set search_path = public, pg_temp
language plpgsql
as $$
declare
  v_titulo text;
  v_popup uuid;
  v_dueno uuid;
  v_joven uuid;
  v_nombre text;
begin
  begin
    if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
      return new;
    end if;
    select pu.titulo, pu.id, e.usuario_id into v_titulo, v_popup, v_dueno
    from popups pu join empresas e on e.id = pu.empresa_id where pu.id = new.popup_id;
    select pj.usuario_id, u.nombre into v_joven, v_nombre
    from perfiles_joven pj join usuarios u on u.id = pj.usuario_id where pj.id = new.joven_id;

    if tg_op = 'INSERT' then
      perform notificar(v_dueno, 'postulacion_nueva', 'Nueva postulación',
        coalesce(v_nombre, 'Un joven') || ' se postuló a “' || v_titulo || '”.', '/empresario/popups/' || v_popup);
    elsif new.estado = 'preseleccionado' then
      perform notificar(v_joven, 'postulacion_estado', '¡Vas bien!',
        'Te preseleccionaron para “' || v_titulo || '”. Mantente atento a tu WhatsApp.', '/joven/popups/' || v_popup);
    elsif new.estado = 'contratado' then
      perform notificar(v_joven, 'postulacion_estado', '¡Felicitaciones, te contrataron!',
        'La empresa te eligió para “' || v_titulo || '”.', '/joven/popups/' || v_popup);
    elsif new.estado = 'descartado' then
      perform notificar(v_joven, 'postulacion_estado', 'Sobre tu postulación',
        'Esta vez no quedaste en “' || v_titulo || '”. ¡Sigue intentando con otras oportunidades!', '/joven/popups');
    end if;
  exception when others then
    raise warning 'avisar_postulacion: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_avisar_postulacion on postulaciones;
create trigger trg_avisar_postulacion
  after insert or update of estado on postulaciones
  for each row execute function avisar_postulacion();

-- Recursos: aviso a los jóvenes activos cuando se publica uno.
create or replace function avisar_recurso()
returns trigger
security definer
set search_path = public, pg_temp
language plpgsql
as $$
begin
  begin
    insert into notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
    select u.id, 'recurso_nuevo', 'Nuevo recurso para ti', '“' || new.titulo || '”. Inscríbete si te interesa.', '/joven/recursos'
    from usuarios u where u.rol = 'joven' and u.estado = 'activo';
  exception when others then
    raise warning 'avisar_recurso: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_avisar_recurso on recursos;
create trigger trg_avisar_recurso
  after insert on recursos
  for each row execute function avisar_recurso();

revoke execute on function avisar_perfil() from public, anon, authenticated;
revoke execute on function avisar_popup() from public, anon, authenticated;
revoke execute on function avisar_postulacion() from public, anon, authenticated;
revoke execute on function avisar_recurso() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Directorio por páginas
-- ---------------------------------------------------------------------------
drop function if exists buscar_directorio(text, uuid, uuid, boolean);
create or replace function buscar_directorio(
  p_busqueda text default null,
  p_habilidad uuid default null,
  p_municipio uuid default null,
  p_solo_disponibles boolean default false,
  p_limite int default 1000,
  p_desplazamiento int default 0
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
    and u.estado = 'activo'
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
  order by pj.disponible desc, u.nombre, u.id
  limit greatest(1, least(coalesce(p_limite, 1000), 1000))
  offset greatest(0, coalesce(p_desplazamiento, 0));
$$;

revoke execute on function buscar_directorio(text, uuid, uuid, boolean, int, int) from anon, public;
grant execute on function buscar_directorio(text, uuid, uuid, boolean, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. El administrador restablece la contraseña de una cuenta
-- ---------------------------------------------------------------------------
create or replace function admin_restablecer_contrasena(p_usuario_id uuid, p_contrasena text)
returns void
security definer
set search_path = public, extensions, pg_temp
language plpgsql
as $$
declare
  v_auth uuid;
begin
  if coalesce(auth_rol(), '') <> 'admin' then
    raise exception 'Solo el administrador puede restablecer contraseñas' using errcode = '42501';
  end if;
  if p_contrasena is null or char_length(p_contrasena) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;
  select auth_id into v_auth from usuarios where id = p_usuario_id;
  if v_auth is null then
    raise exception 'No se encontró la cuenta';
  end if;
  update auth.users
     set encrypted_password = crypt(p_contrasena, gen_salt('bf')),
         updated_at = now()
   where id = v_auth;
end;
$$;

revoke execute on function admin_restablecer_contrasena(uuid, text) from public, anon;
grant execute on function admin_restablecer_contrasena(uuid, text) to authenticated;
