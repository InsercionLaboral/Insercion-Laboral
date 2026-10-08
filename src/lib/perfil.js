import { supabase } from './supabase.js'
import { comprimirImagen } from './imagen.js'

const BUCKET_FOTOS = 'fotos-perfil'

/**
 * Carga el perfil del joven autenticado (por usuario_id) junto con los ids de
 * sus habilidades. Devuelve { perfil, habilidadIds } o { perfil: null } si aún
 * no existe.
 */
export async function getMiPerfil(usuarioId) {
  const { data: perfil, error } = await supabase
    .from('perfiles_joven')
    .select('*')
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!perfil) return { perfil: null, habilidadIds: [] }

  const { data: rels, error: e2 } = await supabase
    .from('joven_habilidades')
    .select('habilidad_id')
    .eq('joven_id', perfil.id)
  if (e2) throw new Error(e2.message)

  return { perfil, habilidadIds: (rels ?? []).map((r) => r.habilidad_id) }
}

/**
 * Sube la foto de perfil (comprimida a WebP) al Storage y devuelve su URL
 * pública. La ruta vive bajo la carpeta del auth.uid() (requerido por la RLS).
 */
export async function subirFoto(authId, file) {
  const blob = await comprimirImagen(file, { maxLado: 512, calidad: 0.8 })
  const ruta = `${authId}/perfil-${Date.now()}.webp`
  const { error } = await supabase.storage
    .from(BUCKET_FOTOS)
    // Sin upsert: cada foto lleva la hora en el nombre (nunca choca) y el modo
    // upsert exigiría un permiso de lectura que el bucket no concede a propósito.
    .upload(ruta, blob, { contentType: 'image/webp', upsert: false })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta)
  return data.publicUrl
}

/**
 * Crea o actualiza el perfil del joven y sincroniza sus habilidades.
 * `enviarRevision`: true → estado 'en_revision'; false → 'borrador'.
 */
export async function guardarPerfil({ usuarioId, datos, habilidadIds, enviarRevision }) {
  const estado_revision = enviarRevision ? 'en_revision' : 'borrador'
  const { data: perfil, error } = await supabase
    .from('perfiles_joven')
    .upsert(
      {
        usuario_id: usuarioId,
        formacion: datos.formacion || null,
        presentacion: datos.presentacion || null,
        telefono: datos.telefono || null,
        disponible: datos.disponible,
        foto_url: datos.foto_url || null,
        estado_revision,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'usuario_id' },
    )
    .select()
    .single()
  if (error) throw new Error(error.message)

  await sincronizarHabilidades(perfil.id, habilidadIds)
  return perfil
}

/** Reemplaza el conjunto de habilidades del joven por el indicado. */
async function sincronizarHabilidades(jovenId, habilidadIds) {
  const { error: eDel } = await supabase
    .from('joven_habilidades')
    .delete()
    .eq('joven_id', jovenId)
  if (eDel) throw new Error(eDel.message)

  if (habilidadIds.length === 0) return
  const filas = habilidadIds.map((habilidad_id) => ({ joven_id: jovenId, habilidad_id }))
  const { error: eIns } = await supabase.from('joven_habilidades').insert(filas)
  if (eIns) throw new Error(eIns.message)
}

/** Cambia solo la disponibilidad (toggle rápido desde el home del joven). */
export async function setDisponible(perfilId, disponible) {
  const { error } = await supabase
    .from('perfiles_joven')
    .update({ disponible, updated_at: new Date().toISOString() })
    .eq('id', perfilId)
  if (error) throw new Error(error.message)
}

/** Ficha pública de un joven (RPC acotada). Devuelve el objeto o null. */
export async function getPerfilPublico(usuarioId) {
  const { data, error } = await supabase.rpc('obtener_perfil_publico', {
    p_usuario_id: usuarioId,
  })
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}

/** Búsqueda del directorio de talento (RPC acotada). */
export async function buscarDirectorio({ busqueda, habilidadId, municipioId, soloDisponibles } = {}) {
  const { data, error } = await supabase.rpc('buscar_directorio', {
    p_busqueda: busqueda || null,
    p_habilidad: habilidadId || null,
    p_municipio: municipioId || null,
    p_solo_disponibles: !!soloDisponibles,
  })
  if (error) throw new Error(error.message)
  return data ?? []
}
