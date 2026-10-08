import { supabase } from './supabase.js'

export const ETIQUETA_ROL = {
  joven: 'Joven',
  empresario: 'Empresario',
  lider: 'Líder de área',
  admin: 'Administrador',
}

/** Todos los usuarios (solo líder/admin lo permiten por RLS). */
export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol, estado, created_at, municipios ( nombre )')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((u) => ({ ...u, municipio: u.municipios?.nombre ?? null }))
}

export async function cambiarEstadoUsuario(id, estado) {
  const { error } = await supabase.from('usuarios').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function cambiarRolUsuario(id, rol) {
  const { error } = await supabase.from('usuarios').update({ rol }).eq('id', id)
  if (error) throw new Error(error.message)
}
