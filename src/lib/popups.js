import { supabase } from './supabase.js'

const CAMPOS_POPUP = `
  id, titulo, descripcion, cupos, pago_estimado,
  fecha_inicio, fecha_fin, fecha_cierre, estado, motivo_revision, created_at,
  empresas ( id, nombre_empresa ),
  municipios ( id, nombre ),
  popup_habilidades ( habilidades ( id, nombre ) )
`

/** Normaliza el resultado anidado de PostgREST a una forma plana y cómoda. */
function normalizar(p) {
  return {
    ...p,
    empresa: p.empresas?.nombre_empresa ?? null,
    municipio: p.municipios?.nombre ?? null,
    habilidades: (p.popup_habilidades ?? []).map((x) => x.habilidades).filter(Boolean),
  }
}

/** Empresa del empresario autenticado. */
export async function getMiEmpresa(usuarioId) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** Crea un pop-up (queda en estado 'pendiente') y sus habilidades requeridas. */
export async function crearPopup({ empresaId, datos, habilidadIds }) {
  const { data: popup, error } = await supabase
    .from('popups')
    .insert({
      empresa_id: empresaId,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      municipio_id: datos.municipio_id || null,
      cupos: datos.cupos ? Number(datos.cupos) : null,
      pago_estimado: datos.pago_estimado || null,
      fecha_inicio: datos.fecha_inicio || null,
      fecha_fin: datos.fecha_fin || null,
      fecha_cierre: datos.fecha_cierre ? new Date(datos.fecha_cierre).toISOString() : null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (habilidadIds.length > 0) {
    const filas = habilidadIds.map((habilidad_id) => ({ popup_id: popup.id, habilidad_id }))
    const { error: e2 } = await supabase.from('popup_habilidades').insert(filas)
    if (e2) throw new Error(e2.message)
  }
  return popup
}

/**
 * Edita un pop-up propio. Siempre vuelve a revisión ('pendiente'): así el
 * equipo revisa los cambios antes de que los jóvenes los vean.
 */
export async function actualizarPopup({ popupId, datos, habilidadIds }) {
  const { error } = await supabase
    .from('popups')
    .update({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      municipio_id: datos.municipio_id || null,
      cupos: datos.cupos ? Number(datos.cupos) : null,
      pago_estimado: datos.pago_estimado || null,
      fecha_inicio: datos.fecha_inicio || null,
      fecha_fin: datos.fecha_fin || null,
      fecha_cierre: datos.fecha_cierre ? new Date(datos.fecha_cierre).toISOString() : null,
      estado: 'pendiente',
    })
    .eq('id', popupId)
  if (error) throw new Error(error.message)

  const { error: eDel } = await supabase.from('popup_habilidades').delete().eq('popup_id', popupId)
  if (eDel) throw new Error(eDel.message)
  if (habilidadIds.length > 0) {
    const filas = habilidadIds.map((habilidad_id) => ({ popup_id: popupId, habilidad_id }))
    const { error: eIns } = await supabase.from('popup_habilidades').insert(filas)
    if (eIns) throw new Error(eIns.message)
  }
}

/** Pop-ups de la empresa, con el conteo de postulaciones. */
export async function listarMisPopups(empresaId) {
  const { data, error } = await supabase
    .from('popups')
    .select(`${CAMPOS_POPUP}, postulaciones ( count )`)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    ...normalizar(p),
    totalPostulaciones: p.postulaciones?.[0]?.count ?? 0,
  }))
}

/** Pop-ups aprobados (los que ve el joven). */
export async function listarPopupsAprobados() {
  const { data, error } = await supabase
    .from('popups')
    .select(CAMPOS_POPUP)
    .eq('estado', 'aprobado')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(normalizar)
}

/** Detalle de un pop-up. */
export async function getPopup(id) {
  const { data, error } = await supabase.from('popups').select(CAMPOS_POPUP).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? normalizar(data) : null
}

/** Cierra un pop-up (deja de recibir postulaciones). */
export async function cerrarPopup(id) {
  const { error } = await supabase.from('popups').update({ estado: 'cerrado' }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------- postulaciones

/** Postulaciones del joven (para saber a qué pop-ups ya se postuló). */
export async function misPostulaciones(jovenId) {
  const { data, error } = await supabase
    .from('postulaciones')
    .select('id, popup_id, estado, created_at')
    .eq('joven_id', jovenId)
  if (error) throw new Error(error.message)
  return data ?? []
}

/** El joven se postula a un pop-up. */
export async function postularse({ popupId, jovenId }) {
  const { data, error } = await supabase
    .from('postulaciones')
    .insert({ popup_id: popupId, joven_id: jovenId })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Ya te postulaste a este pop-up.')
    throw new Error(error.message)
  }
  return data
}

/** Postulantes de un pop-up (RPC acotada al dueño del pop-up o staff). */
export async function listarPostulantes(popupId) {
  const { data, error } = await supabase.rpc('listar_postulaciones_popup', {
    p_popup_id: popupId,
  })
  if (error) throw new Error(error.message)
  return data ?? []
}

/** El empresario cambia el estado de una postulación. */
export async function actualizarEstadoPostulacion(postulacionId, estado) {
  const { error } = await supabase.from('postulaciones').update({ estado }).eq('id', postulacionId)
  if (error) throw new Error(error.message)
}
