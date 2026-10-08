import { supabase } from '../lib/supabase.js'
import { useCatalogo } from './useCatalogo.js'

async function cargarMunicipios() {
  const { data, error } = await supabase.from('municipios').select('id, nombre').order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Catálogo de municipios (lectura pública por RLS). Se usa en el registro y en
 * los filtros del directorio. Reintenta solo y guarda una copia local.
 */
export function useMunicipios() {
  const { datos, cargando, error, reintentar } = useCatalogo('catalogo:municipios', cargarMunicipios)
  return { municipios: datos, cargando, error, reintentar }
}
