import { supabase } from './supabase.js'

/** La tabla aún no existe (base sin la migración): los avisos se ocultan. */
function sinTabla(error) {
  return error && (error.code === 'PGRST205' || error.code === '42P01')
}

/** Cantidad de avisos sin leer. Devuelve null si los avisos no están disponibles. */
export async function contarNoLeidos() {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('leida', false)
  if (error) {
    if (sinTabla(error)) return null
    throw new Error(error.message)
  }
  return count ?? 0
}

/** Últimos avisos de la persona (la RLS solo deja ver los propios). */
export async function listarAvisos(limite = 50) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, tipo, titulo, mensaje, enlace, leida, created_at')
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) {
    if (sinTabla(error)) return []
    throw new Error(error.message)
  }
  return data ?? []
}

export async function marcarLeido(id) {
  const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function marcarTodosLeidos() {
  const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('leida', false)
  if (error) throw new Error(error.message)
}

/** "hace 5 min", "hace 3 h", "hace 2 días". */
export function haceCuanto(iso) {
  const seg = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seg < 60) return 'hace un momento'
  if (seg < 3600) return `hace ${Math.round(seg / 60)} min`
  if (seg < 86400) return `hace ${Math.round(seg / 3600)} h`
  const dias = Math.round(seg / 86400)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}
