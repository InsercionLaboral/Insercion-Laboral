-- ============================================================================
-- Endurecimiento de seguridad (revisión previa al lanzamiento)
--
-- Cierra brechas donde la RLS por sí sola dejaba a una persona autenticada
-- saltarse la moderación o escalar privilegios llamando a la API directamente
-- (sin pasar por la interfaz):
--   1. Registro con rol privilegiado: handle_new_user aceptaba cualquier `rol`
--      enviado en el metadata del signUp (p. ej. 'admin').
--   2. Cada persona podía actualizar su propia fila de `usuarios`, incluidos
--      `rol` y `estado`.
--   3. Un joven podía guardar su perfil como 'aprobado' sin revisión; un
--      empresario podía publicar un pop-up 'aprobado' sin revisión.
--   4. Una postulación se podía insertar con estado 'contratado' o a un pop-up
--      que no estaba aprobado.
--   5. Cualquier usuario podía crear una fila en `empresas`.
--
-- Criterio común: los cambios hechos desde la API por personas que NO son
-- líder/admin quedan acotados; el personal del Comité y las operaciones de
-- mantenimiento (auth.uid() nulo: SQL Editor, migraciones, triggers de Auth)
-- no se ven afectados. Reejecutable.
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
