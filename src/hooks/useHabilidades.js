import { useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { useCatalogo } from './useCatalogo.js'

async function cargarHabilidades() {
  const { data, error } = await supabase
    .from('habilidades')
    .select('id, nombre, categoria')
    .order('categoria')
    .order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Catálogo de habilidades (lectura pública por RLS), agrupado por categoría
 * para el selector del perfil.
 */
export function useHabilidades() {
  const { datos, cargando, error, reintentar } = useCatalogo('catalogo:habilidades', cargarHabilidades)

  const porCategoria = useMemo(() => {
    const grupos = new Map()
    for (const h of datos) {
      const cat = h.categoria ?? 'Otras'
      if (!grupos.has(cat)) grupos.set(cat, [])
      grupos.get(cat).push(h)
    }
    return [...grupos.entries()].map(([categoria, items]) => ({ categoria, items }))
  }, [datos])

  return { habilidades: datos, porCategoria, cargando, error, reintentar }
}
