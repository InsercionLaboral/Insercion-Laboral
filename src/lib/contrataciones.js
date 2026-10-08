import { supabase } from './supabase.js'
import { diasEntre, hoyLocal } from './fechas.js'
import { listarMisPopups, listarPostulantes } from './popups.js'


/** Días de permanencia: hasta hoy si sigue vinculado; hasta el último seguimiento si terminó. */
export function diasPermanencia(c) {
  if (c.activo) return diasEntre(c.fechaInicio)
  return diasEntre(c.fechaInicio, c.ultimoSeguimiento ?? undefined)
}

/** true si lleva más de `limite` días sin confirmar seguimiento (solo contrataciones activas). */
export function requiereSeguimiento(c, limite = 30) {
  if (!c.activo) return false
  const base = c.ultimoSeguimiento ?? c.fechaInicio
  const dias = diasEntre(base)
  return dias != null && dias >= limite
}

const FK_TITULAR = 'usuarios!perfiles_joven_usuario_id_fkey'

/**
 * Registra la contratación de una postulación (idempotente: si ya existe, no
 * la duplica). Se llama al marcar a un joven como "contratado".
 */
export async function registrarContratacion(postulacionId, fechaInicio = hoyLocal()) {
  const { error } = await supabase
    .from('contrataciones')
    .upsert(
      { postulacion_id: postulacionId, fecha_inicio: fechaInicio, activo: true },
      { onConflict: 'postulacion_id', ignoreDuplicates: true },
    )
  if (error) throw new Error(error.message)
}

/** Corrige un error: si se deja de marcar como contratado, se retira el registro. */
export async function deshacerContratacion(postulacionId) {
  const { error } = await supabase.from('contrataciones').delete().eq('postulacion_id', postulacionId)
  if (error) throw new Error(error.message)
}

/** Seguimiento: confirma que la persona sigue vinculada (o que terminó la vinculación). */
export async function registrarSeguimiento(contratacionId, { sigueVinculado }) {
  const { error } = await supabase
    .from('contrataciones')
    .update({ activo: sigueVinculado, fecha_ultimo_seguimiento: hoyLocal() })
    .eq('id', contratacionId)
  if (error) throw new Error(error.message)
}

/** Corrige la fecha de inicio de una contratación. */
export async function cambiarFechaInicio(contratacionId, fechaInicio) {
  const { error } = await supabase
    .from('contrataciones')
    .update({ fecha_inicio: fechaInicio })
    .eq('id', contratacionId)
  if (error) throw new Error(error.message)
}

/**
 * Contrataciones de la empresa del empresario. Los nombres de los jóvenes se
 * obtienen de las postulaciones (función acotada al dueño del pop-up). Si hay
 * postulaciones "contratadas" de antes sin su registro de contratación, se crea.
 */
export async function listarContratacionesEmpresa(empresaId) {
  const popups = await listarMisPopups(empresaId)
  const grupos = await Promise.all(
    popups.map(async (pop) => {
      const postulantes = await listarPostulantes(pop.id)
      return postulantes
        .filter((p) => p.estado === 'contratado')
        .map((p) => ({ ...p, popupTitulo: pop.titulo }))
    }),
  )
  const contratados = grupos.flat()
  if (contratados.length === 0) return []

  const ids = contratados.map((p) => p.postulacion_id)
  const consulta = () =>
    supabase
      .from('contrataciones')
      .select('id, postulacion_id, fecha_inicio, activo, fecha_ultimo_seguimiento')
      .in('postulacion_id', ids)

  let { data, error } = await consulta()
  if (error) throw new Error(error.message)

  const existentes = new Set((data ?? []).map((c) => c.postulacion_id))
  const faltantes = contratados.filter((p) => !existentes.has(p.postulacion_id))
  if (faltantes.length > 0) {
    await Promise.all(faltantes.map((p) => registrarContratacion(p.postulacion_id)))
    ;({ data, error } = await consulta())
    if (error) throw new Error(error.message)
  }

  const porPostulacion = new Map((data ?? []).map((c) => [c.postulacion_id, c]))
  return contratados
    .map((p) => {
      const c = porPostulacion.get(p.postulacion_id)
      return c
        ? {
            id: c.id,
            fechaInicio: c.fecha_inicio,
            activo: c.activo,
            ultimoSeguimiento: c.fecha_ultimo_seguimiento,
            joven: p.nombre,
            usuarioId: p.usuario_id,
            fotoUrl: p.foto_url,
            municipio: p.municipio,
            popup: p.popupTitulo,
            empresa: null,
          }
        : null
    })
    .filter(Boolean)
    .sort((a, b) => (b.fechaInicio ?? '').localeCompare(a.fechaInicio ?? ''))
}

/** Todas las contrataciones (líder / admin). */
export async function listarContratacionesStaff() {
  const { data, error } = await supabase
    .from('contrataciones')
    .select(
      `id, fecha_inicio, activo, fecha_ultimo_seguimiento,
       postulaciones (
         id,
         popups ( id, titulo, empresas ( nombre_empresa ) ),
         perfiles_joven ( usuario_id, foto_url, ${FK_TITULAR} ( nombre, municipios ( nombre ) ) )
       )`,
    )
    .order('fecha_inicio', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => {
    const pj = c.postulaciones?.perfiles_joven
    return {
      id: c.id,
      fechaInicio: c.fecha_inicio,
      activo: c.activo,
      ultimoSeguimiento: c.fecha_ultimo_seguimiento,
      joven: pj?.usuarios?.nombre ?? '—',
      usuarioId: pj?.usuario_id,
      fotoUrl: pj?.foto_url,
      municipio: pj?.usuarios?.municipios?.nombre ?? null,
      popup: c.postulaciones?.popups?.titulo ?? '—',
      empresa: c.postulaciones?.popups?.empresas?.nombre_empresa ?? null,
    }
  })
}
