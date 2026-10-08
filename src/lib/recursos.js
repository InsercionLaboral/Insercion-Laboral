import { supabase } from './supabase.js'
import { enlaceSeguro } from './proyectos.js'

export const TIPOS_RECURSO = [
  { valor: 'curso', texto: 'Curso', icono: '📚' },
  { valor: 'webinar', texto: 'Webinar', icono: '🎥' },
  { valor: 'taller', texto: 'Taller', icono: '🛠️' },
  { valor: 'mentoria', texto: 'Mentoría', icono: '🤝' },
  { valor: 'capsula', texto: 'Cápsula', icono: '💡' },
  { valor: 'infografia', texto: 'Infografía', icono: '🖼️' },
]

export const infoTipo = (valor) =>
  TIPOS_RECURSO.find((t) => t.valor === valor) ?? { valor, texto: valor, icono: '📄' }

/** Biblioteca completa, con cuántas personas se inscribieron (el personal ve todas). */
export async function listarRecursos() {
  const { data, error } = await supabase
    .from('recursos')
    .select('id, tipo, titulo, descripcion, url_recurso, fecha_publicacion, created_at, inscripciones ( count )')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ ...r, inscritos: r.inscripciones?.[0]?.count ?? 0 }))
}

function filaRecurso(datos) {
  const titulo = datos.titulo?.trim()
  if (!titulo || titulo.length < 3) throw new Error('Escribe un título (mínimo 3 letras).')
  if (!datos.tipo) throw new Error('Elige el tipo de recurso.')
  const url = datos.url_recurso?.trim()
  const enlace = url ? enlaceSeguro(url) : null
  if (url && !enlace) throw new Error('El enlace no es válido. Debe empezar por http:// o https://')
  return {
    tipo: datos.tipo,
    titulo,
    descripcion: datos.descripcion?.trim() || null,
    url_recurso: enlace,
  }
}

export async function crearRecurso(datos, creadoPor) {
  const { error } = await supabase.from('recursos').insert({ ...filaRecurso(datos), creado_por: creadoPor })
  if (error) throw new Error(error.message)
}

export async function actualizarRecurso(id, datos) {
  const { error } = await supabase.from('recursos').update(filaRecurso(datos)).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarRecurso(id) {
  const { error } = await supabase.from('recursos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Ids de recursos a los que el joven (por perfil) ya está inscrito. */
export async function misInscripciones(perfilId) {
  const { data, error } = await supabase.from('inscripciones').select('recurso_id').eq('joven_id', perfilId)
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((i) => i.recurso_id))
}

export async function inscribirse(recursoId, perfilId) {
  const { error } = await supabase
    .from('inscripciones')
    .upsert({ recurso_id: recursoId, joven_id: perfilId }, { onConflict: 'recurso_id,joven_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export async function cancelarInscripcion(recursoId, perfilId) {
  const { error } = await supabase
    .from('inscripciones')
    .delete()
    .eq('recurso_id', recursoId)
    .eq('joven_id', perfilId)
  if (error) throw new Error(error.message)
}
