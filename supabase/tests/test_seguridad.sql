\set ON_ERROR_STOP off
\pset pager off
set client_min_messages = notice;

-- ---------- ayudantes ----------
create or replace function public.t_bloquea(etiqueta text, consulta text, uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  execute 'set local role authenticated';
  begin
    execute consulta;
    raise notice 'FALLA  (debía bloquearse): %', etiqueta;
  exception when others then
    raise notice 'ok     bloqueado: %  [%]', etiqueta, sqlerrm;
  end;
  execute 'reset role';
end $$;

create or replace function public.t_permite(etiqueta text, consulta text, uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  execute 'set local role authenticated';
  begin
    execute consulta;
    raise notice 'ok     permitido: %', etiqueta;
  exception when others then
    raise notice 'FALLA  (debía permitirse): %  [%]', etiqueta, sqlerrm;
  end;
  execute 'reset role';
end $$;

create or replace function public.t_igual(etiqueta text, actual anyelement, esperado anyelement) returns void language plpgsql as $$
begin
  if actual is not distinct from esperado then raise notice 'ok     %: %', etiqueta, actual;
  else raise notice 'FALLA  %: obtenido=% esperado=%', etiqueta, actual, esperado; end if;
end $$;

-- ---------- datos de prueba (como mantenimiento: auth.uid() nulo) ----------
insert into municipios (id, nombre) values ('00000000-0000-0000-0000-0000000000a1', 'Manizales') on conflict do nothing;

insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-0000-0000-0000-000000000001', 'joven1@t.co',  '{"rol":"joven","nombre":"Joven Uno","autorizacion_datos":true,"municipio_id":"00000000-0000-0000-0000-0000000000a1"}'),
 ('11111111-0000-0000-0000-000000000002', 'joven2@t.co',  '{"rol":"joven","nombre":"Joven Dos","autorizacion_datos":true}'),
 ('11111111-0000-0000-0000-000000000003', 'empre1@t.co',  '{"rol":"empresario","nombre":"Empresa Uno","autorizacion_datos":true,"nombre_empresa":"Café SAS"}'),
 ('11111111-0000-0000-0000-000000000004', 'empre2@t.co',  '{"rol":"empresario","nombre":"Empresa Dos","autorizacion_datos":true,"nombre_empresa":"Otra SAS"}'),
 ('11111111-0000-0000-0000-000000000005', 'lider@t.co',   '{"rol":"joven","nombre":"Lider","autorizacion_datos":true}'),
 ('11111111-0000-0000-0000-000000000006', 'admin@t.co',   '{"rol":"joven","nombre":"Admin","autorizacion_datos":true}');
update usuarios set rol = 'lider' where email = 'lider@t.co';
update usuarios set rol = 'admin' where email = 'admin@t.co';
update usuarios set onboarding_completo = true;

select set_config('t.j1', (select id::text from usuarios where email='joven1@t.co'), false);
select set_config('t.j2', (select id::text from usuarios where email='joven2@t.co'), false);
select set_config('t.e1', (select id::text from usuarios where email='empre1@t.co'), false);
select set_config('t.e2', (select id::text from usuarios where email='empre2@t.co'), false);

\echo '=== 1. REGISTRO: nadie puede autoregistrarse con rol privilegiado ==='
insert into auth.users (id, email, raw_user_meta_data) values
 ('22222222-0000-0000-0000-000000000001', 'hacker@t.co', '{"rol":"admin","nombre":"Hacker","autorizacion_datos":true}'),
 ('22222222-0000-0000-0000-000000000002', 'hacker2@t.co', '{"rol":"lider","nombre":"Hacker2","autorizacion_datos":true}');
select public.t_igual('registro con rol admin/lider NO crea usuario', (select count(*) from usuarios where email in ('hacker@t.co','hacker2@t.co')), 0::bigint);
select public.t_igual('registro normal de joven sí crea usuario', (select count(*) from usuarios where email = 'joven1@t.co'), 1::bigint);
select public.t_igual('registro de empresario crea su empresa', (select count(*) from empresas where nombre_empresa = 'Café SAS'), 1::bigint);

\echo '=== 2. USUARIOS: no se puede escalar privilegios ==='
select public.t_bloquea('joven se pone rol admin', format($q$update usuarios set rol='admin' where auth_id='11111111-0000-0000-0000-000000000001'$q$), '11111111-0000-0000-0000-000000000001');
select public.t_bloquea('joven cambia su estado', format($q$update usuarios set estado='pendiente' where auth_id='11111111-0000-0000-0000-000000000001'$q$), '11111111-0000-0000-0000-000000000001');
select public.t_bloquea('joven se marca/desmarca como menor de edad', format($q$update usuarios set es_menor_edad=true where auth_id='11111111-0000-0000-0000-000000000001'$q$), '11111111-0000-0000-0000-000000000001');
select public.t_permite('joven cambia su nombre', format($q$update usuarios set nombre='Joven Uno B' where auth_id='11111111-0000-0000-0000-000000000001'$q$), '11111111-0000-0000-0000-000000000001');
select public.t_permite('joven completa su onboarding', format($q$update usuarios set onboarding_completo=true where auth_id='11111111-0000-0000-0000-000000000001'$q$), '11111111-0000-0000-0000-000000000001');
select public.t_bloquea('inserta una fila admin para si mismo', format($q$insert into usuarios (auth_id, rol, nombre, email) values ('33333333-0000-0000-0000-000000000001','admin','X','x@t.co')$q$), '33333333-0000-0000-0000-000000000001');
select public.t_permite('admin desactiva a un joven', format($q$update usuarios set estado='inactivo' where id='%s'$q$, current_setting('t.j2')), '11111111-0000-0000-0000-000000000006');
select public.t_igual('el estado quedó inactivo', (select estado from usuarios where id = current_setting('t.j2')::uuid), 'inactivo'::text);
update usuarios set estado = 'activo' where id = current_setting('t.j2')::uuid;
select public.t_permite('lider intenta cambiar rol (RLS lo deja sin efecto)', format($q$update usuarios set rol='admin' where id='%s'$q$, current_setting('t.j2')), '11111111-0000-0000-0000-000000000005');
select public.t_igual('el rol del joven2 sigue siendo joven', (select rol from usuarios where id = current_setting('t.j2')::uuid), 'joven'::text);

\echo '=== 3. PERFILES: el joven no se aprueba solo ==='
select public.t_bloquea('joven crea perfil ya aprobado', format($q$insert into perfiles_joven (usuario_id, presentacion, estado_revision) values ('%s','hola','aprobado')$q$, current_setting('t.j1')), '11111111-0000-0000-0000-000000000001');
select public.t_permite('joven crea perfil en revisión', format($q$insert into perfiles_joven (usuario_id, presentacion, estado_revision, revisado_por) values ('%s','hola','en_revision','%s')$q$, current_setting('t.j1'), current_setting('t.e1')), '11111111-0000-0000-0000-000000000001');
select public.t_igual('revisado_por se ignora al crear', (select revisado_por from perfiles_joven where usuario_id = current_setting('t.j1')::uuid), null::uuid);
select public.t_bloquea('joven se aprueba a si mismo', format($q$update perfiles_joven set estado_revision='aprobado' where usuario_id='%s'$q$, current_setting('t.j1')), '11111111-0000-0000-0000-000000000001');
select public.t_permite('lider aprueba el perfil', format($q$update perfiles_joven set estado_revision='aprobado', revisado_por='%s', fecha_revision=now() where usuario_id='%s'$q$, (select id from usuarios where email='lider@t.co'), current_setting('t.j1')), '11111111-0000-0000-0000-000000000005');
select public.t_igual('perfil aprobado', (select estado_revision from perfiles_joven where usuario_id = current_setting('t.j1')::uuid), 'aprobado'::text);
select public.t_permite('joven cambia solo su disponibilidad (sigue aprobado)', format($q$update perfiles_joven set disponible=false where usuario_id='%s'$q$, current_setting('t.j1')), '11111111-0000-0000-0000-000000000001');
select public.t_igual('sigue aprobado tras cambiar disponibilidad', (select estado_revision from perfiles_joven where usuario_id = current_setting('t.j1')::uuid), 'aprobado'::text);
select public.t_permite('joven edita su presentación', format($q$update perfiles_joven set presentacion='texto nuevo' where usuario_id='%s'$q$, current_setting('t.j1')), '11111111-0000-0000-0000-000000000001');
select public.t_igual('editar contenido devuelve el perfil a revisión', (select estado_revision from perfiles_joven where usuario_id = current_setting('t.j1')::uuid), 'en_revision'::text);
select public.t_bloquea('joven falsifica revisado_por/estado en un solo update', format($q$update perfiles_joven set estado_revision='rechazado' where usuario_id='%s'$q$, current_setting('t.j1')), '11111111-0000-0000-0000-000000000001');
update perfiles_joven set estado_revision='aprobado' where usuario_id = current_setting('t.j1')::uuid;

\echo '=== 4. POP-UPS: el empresario no publica sin aprobación ==='
select set_config('t.emp1', (select id::text from empresas where nombre_empresa='Café SAS'), false);
select public.t_permite('empresario publica pop-up pidiendo estado aprobado', format($q$insert into popups (empresa_id, titulo, descripcion, estado, revisado_por) values ('%s','Pop 1','desc','aprobado','%s')$q$, current_setting('t.emp1'), current_setting('t.e1')), '11111111-0000-0000-0000-000000000003');
select public.t_igual('el pop-up quedó pendiente', (select estado from popups where titulo='Pop 1'), 'pendiente'::text);
select public.t_bloquea('empresario se aprueba su pop-up', $q$update popups set estado='aprobado' where titulo='Pop 1'$q$, '11111111-0000-0000-0000-000000000003');
select public.t_permite('otra empresa intenta editar pop-up ajeno (RLS: 0 filas)', $q$update popups set titulo='robado' where titulo='Pop 1'$q$, '11111111-0000-0000-0000-000000000004');
select public.t_igual('el pop-up ajeno no cambió', (select count(*) from popups where titulo='Pop 1'), 1::bigint);
select public.t_permite('lider aprueba el pop-up', format($q$update popups set estado='aprobado', revisado_por='%s', fecha_publicacion=now() where titulo='Pop 1'$q$, (select id from usuarios where email='lider@t.co')), '11111111-0000-0000-0000-000000000005');
select public.t_permite('empresario cierra su pop-up aprobado', $q$update popups set estado='cerrado' where titulo='Pop 1'$q$, '11111111-0000-0000-0000-000000000003');
update popups set estado = 'aprobado' where titulo = 'Pop 1';
select public.t_permite('empresario cambia el titulo de un pop-up aprobado', $q$update popups set titulo='Pop 1 editado' where titulo='Pop 1'$q$, '11111111-0000-0000-0000-000000000003');
select public.t_igual('vuelve a revisión', (select estado from popups where titulo='Pop 1 editado'), 'pendiente'::text);
update popups set estado='aprobado', titulo='Pop 1' where titulo='Pop 1 editado';

\echo '=== 5. POSTULACIONES ==='
insert into popups (empresa_id, titulo, descripcion, estado) values (current_setting('t.emp1')::uuid, 'Pop pendiente', 'x', 'pendiente');
select set_config('t.pj1', (select id::text from perfiles_joven where usuario_id=current_setting('t.j1')::uuid), false);
select set_config('t.pop1', (select id::text from popups where titulo='Pop 1'), false);
select set_config('t.popP', (select id::text from popups where titulo='Pop pendiente'), false);
select public.t_permite('joven se postula pidiendo estado contratado', format($q$insert into postulaciones (popup_id, joven_id, estado) values ('%s','%s','contratado')$q$, current_setting('t.pop1'), current_setting('t.pj1')), '11111111-0000-0000-0000-000000000001');
select public.t_igual('la postulación nació enviada', (select estado from postulaciones where popup_id=current_setting('t.pop1')::uuid), 'enviada'::text);
select public.t_bloquea('postulación a un pop-up pendiente', format($q$insert into postulaciones (popup_id, joven_id) values ('%s','%s')$q$, current_setting('t.popP'), current_setting('t.pj1')), '11111111-0000-0000-0000-000000000001');
select public.t_permite('joven intenta cambiar el estado de su postulación (RLS: 0 filas)', $q$update postulaciones set estado='contratado'$q$, '11111111-0000-0000-0000-000000000001');
select public.t_igual('sigue enviada', (select estado from postulaciones limit 1), 'enviada'::text);

\echo '=== 6. CONTRATACIONES ==='
select set_config('t.post1', (select id::text from postulaciones limit 1), false);
select public.t_bloquea('contratación sin marcar contratado', format($q$insert into contrataciones (postulacion_id, fecha_inicio) values ('%s', current_date)$q$, current_setting('t.post1')), '11111111-0000-0000-0000-000000000003');
select public.t_permite('empresario marca contratado', format($q$update postulaciones set estado='contratado' where id='%s'$q$, current_setting('t.post1')), '11111111-0000-0000-0000-000000000003');
select public.t_permite('empresario registra contratación', format($q$insert into contrataciones (postulacion_id, fecha_inicio, activo) values ('%s', current_date, true) on conflict (postulacion_id) do nothing$q$, current_setting('t.post1')), '11111111-0000-0000-0000-000000000003');
select public.t_permite('empresario registra seguimiento', format($q$update contrataciones set fecha_ultimo_seguimiento=current_date where postulacion_id='%s'$q$, current_setting('t.post1')), '11111111-0000-0000-0000-000000000003');
select public.t_igual('1 contratación', (select count(*) from contrataciones), 1::bigint);
set role authenticated; select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000004', false);
select public.t_igual('la otra empresa NO ve la contratación', (select count(*) from contrataciones), 0::bigint);
select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000002', false);
select public.t_igual('otro joven NO ve la contratación', (select count(*) from contrataciones), 0::bigint);
select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000001', false);
select public.t_igual('el joven contratado SÍ la ve', (select count(*) from contrataciones), 1::bigint);
reset role;

\echo '=== 7. EMPRESAS ==='
select public.t_bloquea('un joven crea una empresa', format($q$insert into empresas (usuario_id, nombre_empresa) values ('%s','Falsa SAS')$q$, current_setting('t.j1')), '11111111-0000-0000-0000-000000000001');

\echo '=== 8. PROYECTOS DESTACADOS ==='
select public.t_permite('joven agrega un proyecto', format($q$insert into proyectos_joven (joven_id, titulo, descripcion) values ('%s','Mi proyecto','desc')$q$, current_setting('t.pj1')), '11111111-0000-0000-0000-000000000001');
select public.t_bloquea('otro joven agrega proyecto al perfil ajeno', format($q$insert into proyectos_joven (joven_id, titulo) values ('%s','Intruso')$q$, current_setting('t.pj1')), '11111111-0000-0000-0000-000000000002');
select public.t_bloquea('título demasiado corto', format($q$insert into proyectos_joven (joven_id, titulo) values ('%s','ab')$q$, current_setting('t.pj1')), '11111111-0000-0000-0000-000000000001');
set role authenticated; select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000004', false);
select public.t_igual('empresario ve proyectos de perfil aprobado', (select count(*) from proyectos_joven), 1::bigint);
reset role; select set_config('request.jwt.claim.sub','',false);
update perfiles_joven set estado_revision='borrador' where id = current_setting('t.pj1')::uuid;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000004', false);
select public.t_igual('empresario NO ve proyectos de perfil no aprobado', (select count(*) from proyectos_joven), 0::bigint);
select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000002', false);
select public.t_igual('otro joven NO ve proyectos de perfil no aprobado', (select count(*) from proyectos_joven), 0::bigint);
select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000001', false);
select public.t_igual('el dueño sí ve sus proyectos', (select count(*) from proyectos_joven), 1::bigint);
reset role; select set_config('request.jwt.claim.sub','',false);
update perfiles_joven set estado_revision='aprobado' where id = current_setting('t.pj1')::uuid;

\echo '=== 9. ANÓNIMOS ==='
select set_config('request.jwt.claim.sub','',false);
set role anon;
select public.t_igual('anon no ve usuarios', (select count(*) from usuarios), 0::bigint);
select public.t_igual('anon no ve perfiles', (select count(*) from perfiles_joven), 0::bigint);
select public.t_igual('anon no ve pop-ups aprobados', (select count(*) from popups), 0::bigint);
select public.t_igual('anon no ve habilidades de perfiles', (select count(*) from joven_habilidades), 0::bigint);
select public.t_igual('anon no ve proyectos', (select count(*) from proyectos_joven), 0::bigint);
select public.t_igual('anon sí ve municipios (catálogo de registro)', (select count(*) > 0 from municipios), true);
reset role;

\echo '=== 10. KPI y RLS de catálogos ==='
set role authenticated; select set_config('request.jwt.claim.sub','11111111-0000-0000-0000-000000000006', false);
select public.t_igual('admin ve la vista KPI con datos', (select count(*) > 0 from vista_kpi_municipio), true);
reset role;
