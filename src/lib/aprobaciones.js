import { supabase } from './supabase.js'

// perfiles_joven tiene DOS claves foráneas hacia usuarios (usuario_id y
// revisado_por), así que los embeds deben nombrar la FK explícitamente.
const FK_TITULAR = 'usuarios!perfiles_joven_usuario_id_fkey'
const FK_REVISOR = 'usuarios!perfiles_joven_revisado_por_fkey'

const CAMPOS_PERFIL = `
  id, presentacion, formacion, foto_url, telefono, estado_revision, updated_at,
  titular:${FK_TITULAR} ( id, nombre, municipios ( nombre ) ),
  joven_habilidades ( habilidades ( id, nombre ) )
`

function normalizarPerfil(p) {
  return {
    id: p.id,
    usuarioId: p.titular?.id,
    nombre: p.titular?.nombre ?? '—',
    municipio: p.titular?.municipios?.nombre ?? null,
    presentacion: p.presentacion,
    formacion: p.formacion,
    fotoUrl: p.foto_url,
    telefono: p.telefono,
    estado: p.estado_revision,
    actualizado: p.updated_at,
    habilidades: (p.joven_habilidades ?? []).map((x) => x.habilidades).filter(Boolean),
  }
}

/** Perfiles de joven esperando revisión. */
export async function listarPerfilesPendientes() {
  const { data, error } = await supabase
    .from('perfiles_joven')
    .select(CAMPOS_PERFIL)
    .eq('estado_revision', 'en_revision')
    .order('updated_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(normalizarPerfil)
}

/** Pop-ups esperando aprobación. */
export async function listarPopupsPendientes() {
  const { data, error } = await supabase
    .from('popups')
    .select(
      `id, titulo, descripcion, cupos, pago_estimado, fecha_inicio, fecha_fin, estado, created_at,
       empresas ( nombre_empresa ), municipios ( nombre ),
       popup_habilidades ( habilidades ( id, nombre ) )`,
    )
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    ...p,
    empresa: p.empresas?.nombre_empresa ?? null,
    municipio: p.municipios?.nombre ?? null,
    habilidades: (p.popup_habilidades ?? []).map((x) => x.habilidades).filter(Boolean),
  }))
}

/**
 * Id y estado del perfil de un joven a partir de su usuario_id (staff puede
 * leerlo por RLS). Se usa en la pantalla de revisión en detalle.
 */
export async function getPerfilPorUsuario(usuarioId) {
  const { data, error } = await supabase
    .from('perfiles_joven')
    .select('id, estado_revision')
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Aprueba o rechaza un perfil, dejando registro de quién y cuándo. Al rechazar,
 * `motivo` explica al joven qué debe corregir (lo ve en su perfil y en sus avisos).
 */
export async function revisarPerfil({ perfilId, aprobado, revisorId, motivo = null }) {
  const { error } = await supabase
    .from('perfiles_joven')
    .update({
      estado_revision: aprobado ? 'aprobado' : 'rechazado',
      motivo_revision: aprobado ? null : motivo?.trim() || null,
      revisado_por: revisorId,
      fecha_revision: new Date().toISOString(),
    })
    .eq('id', perfilId)
  if (error) throw new Error(error.message)
}

/** Aprueba o rechaza un pop-up. Al aprobar, marca la fecha de publicación. */
export async function revisarPopup({ popupId, aprobado, revisorId, motivo = null }) {
  const { error } = await supabase
    .from('popups')
    .update({
      estado: aprobado ? 'aprobado' : 'rechazado',
      motivo_revision: aprobado ? null : motivo?.trim() || null,
      revisado_por: revisorId,
      ...(aprobado ? { fecha_publicacion: new Date().toISOString() } : {}),
    })
    .eq('id', popupId)
  if (error) throw new Error(error.message)
}

/** Deshace una decisión: el perfil o el pop-up vuelve a la cola de revisión. */
export async function devolverARevision({ tipo, id }) {
  const { error } =
    tipo === 'Perfil'
      ? await supabase
          .from('perfiles_joven')
          .update({ estado_revision: 'en_revision', motivo_revision: null })
          .eq('id', id)
      : await supabase.from('popups').update({ estado: 'pendiente', motivo_revision: null }).eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Auditoría básica: últimas revisiones de perfiles y pop-ups, con quién las hizo.
 * Devuelve una lista unificada ordenada por fecha descendente.
 */
export async function listarAuditoria(limite = 20) {
  const [perfiles, popups] = await Promise.all([
    supabase
      .from('perfiles_joven')
      .select(
        `id, estado_revision, fecha_revision,
         titular:${FK_TITULAR} ( nombre ),
         revisor:${FK_REVISOR} ( nombre )`,
      )
      .not('revisado_por', 'is', null)
      .order('fecha_revision', { ascending: false })
      .limit(limite),
    supabase
      .from('popups')
      .select(
        'id, titulo, estado, fecha_publicacion, created_at, revisor:usuarios!popups_revisado_por_fkey ( nombre )',
      )
      .not('revisado_por', 'is', null)
      .order('fecha_publicacion', { ascending: false })
      .limit(limite),
  ])
  if (perfiles.error) throw new Error(perfiles.error.message)
  if (popups.error) throw new Error(popups.error.message)

  const items = [
    ...(perfiles.data ?? []).map((p) => ({
      id: `perfil-${p.id}`,
      entidadId: p.id,
      tipo: 'Perfil',
      titulo: p.titular?.nombre ?? '—',
      estado: p.estado_revision,
      revisor: p.revisor?.nombre ?? '—',
      fecha: p.fecha_revision,
    })),
    ...(popups.data ?? []).map((p) => ({
      id: `popup-${p.id}`,
      entidadId: p.id,
      tipo: 'Pop-up',
      titulo: p.titulo,
      estado: p.estado,
      revisor: p.revisor?.nombre ?? '—',
      fecha: p.fecha_publicacion ?? p.created_at,
    })),
  ]
  return items.sort((a, b) => new Date(b.fecha ?? 0) - new Date(a.fecha ?? 0)).slice(0, limite)
}
