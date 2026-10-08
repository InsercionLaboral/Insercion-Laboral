-- ============================================================================
-- LIMPIEZA DE DATOS DE PRUEBA Y DEMO (antes del lanzamiento)
-- Pegar completo en Supabase > SQL Editor > Run.
--
-- Borra las cuentas de prueba y de demostración y todo lo que crearon
-- (perfiles, proyectos, empresas, pop-ups, postulaciones, contrataciones,
-- inscripciones, avisos y los recursos publicados por ellas).
-- Las revisiones que hicieron esas cuentas pasan a la líder oficial, para no
-- perder el historial de quién revisó qué.
--
-- NO toca: las cuentas oficiales ni las personas reales que probaron la plataforma.
-- Las fotos de perfil que subieron quedan en Storage > fotos-perfil (carpeta con
-- el id de cada cuenta); se pueden borrar desde ahí si se desea.
-- ============================================================================

begin;

create temporary table cuentas_a_borrar on commit drop as
select a.id as auth_id, u.id as usuario_id, a.email
from auth.users a
left join public.usuarios u on u.auth_id = a.id
where lower(a.email) in (
  -- pruebas de la revisión
  'joven.prueba@insercioncaldas.co',
  'empresario.prueba@insercioncaldas.co',
  'joven.captura@insercioncaldas.co',
  'admin.prueba@insercioncaldas.co',
  'lider.prueba@insercioncaldas.co',
  'intruso.prueba.seguridad@insercioncaldas.co',
  -- datos de demostración iniciales
  'joven.demo@insercioncaldas.co',
  'empresa.demo@insercioncaldas.co',
  'lider.demo@insercioncaldas.co',
  'admin.demo@insercioncaldas.co',
  'yesenia.demo@insercioncaldas.co',
  'sebastian.demo@insercioncaldas.co'
);

-- 1) Qué se va a borrar
select email from cuentas_a_borrar order by email;

-- 2) Las revisiones hechas por estas cuentas pasan a la líder oficial
update public.perfiles_joven
   set revisado_por = (select id from public.usuarios where lower(email) = 'edurural.giraldo.lucelly@gmail.com')
 where revisado_por in (select usuario_id from cuentas_a_borrar);
update public.popups
   set revisado_por = (select id from public.usuarios where lower(email) = 'edurural.giraldo.lucelly@gmail.com')
 where revisado_por in (select usuario_id from cuentas_a_borrar);

-- 3) Recursos publicados por estas cuentas (eran de prueba)
delete from public.recursos where creado_por in (select usuario_id from cuentas_a_borrar);

-- 4) Las cuentas (arrastra su usuario, perfil, empresa, pop-ups, postulaciones,
--    contrataciones, inscripciones y avisos)
delete from auth.users where id in (select auth_id from cuentas_a_borrar);

-- 5) Verificación: quién queda
select u.rol, u.nombre, u.email, u.estado from public.usuarios u order by u.rol, u.nombre;

commit;
