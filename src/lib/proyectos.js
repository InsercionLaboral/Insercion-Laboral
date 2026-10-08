import { supabase } from './supabase.js'

export const MAX_PROYECTOS = 3

// Una vez detectado que la tabla no existe, no se vuelve a consultar en la sesión.
let tablaAusente = false

/** Si la tabla aún no existe en la base, la sección se oculta sin romper el perfil. */
function tablaNoExiste(error) {
  if (!error) return false
  if (error.code === 'PGRST205' || error.code === '42P01') return true
  const msg = error.message ?? ''
  return msg.includes('proyectos_joven') && /schema cache|does not exist/i.test(msg)
}

/** Solo se enlazan direcciones http(s); evita esquemas como javascript:. */
export function enlaceSeguro(valor) {
  if (!valor) return null
  const limpio = valor.trim()
  if (!limpio) return null
  const conProtocolo = /^[a-z][a-z0-9+.-]*:/i.test(limpio) ? limpio : `https://${limpio}`
  try {
    const url = new URL(conProtocolo)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/** Proyectos destacados de un joven, a partir de su usuario_id. */
export async function listarProyectosDeUsuario(usuarioId) {
  if (tablaAusente) return { disponible: false, items: [] }
  const { data, error } = await supabase
    .from('proyectos_joven')
    .select('id, titulo, descripcion, enlace, anio, orden, perfiles_joven!inner ( usuario_id )')
    .eq('perfiles_joven.usuario_id', usuarioId)
    .order('orden')
    .order('created_at')
  if (error) {
    if (tablaNoExiste(error)) {
      tablaAusente = true
      return { disponible: false, items: [] }
    }
    throw new Error(error.message)
  }
  return { disponible: true, items: data ?? [] }
}

/** Reemplaza los proyectos del perfil por la lista indicada. */
export async function guardarProyectos(perfilId, proyectos) {
  const { error: eDel } = await supabase.from('proyectos_joven').delete().eq('joven_id', perfilId)
  if (eDel) throw new Error(eDel.message)
  const filas = proyectos.slice(0, MAX_PROYECTOS).map((p, i) => ({
    joven_id: perfilId,
    titulo: p.titulo.trim(),
    descripcion: p.descripcion?.trim() || null,
    enlace: enlaceSeguro(p.enlace),
    orden: i,
  }))
  if (filas.length === 0) return
  const { error } = await supabase.from('proyectos_joven').insert(filas)
  if (error) throw new Error(error.message)
}
