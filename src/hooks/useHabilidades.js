import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Carga el catálogo de habilidades (lectura pública por RLS), agrupado por
 * categoría para el selector del perfil.
 */
export function useHabilidades() {
  const [habilidades, setHabilidades] = useState([])
  const [porCategoria, setPorCategoria] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    supabase
      .from('habilidades')
      .select('id, nombre, categoria')
      .order('categoria')
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo) return
        if (error) {
          setError(error.message)
        } else {
          setHabilidades(data ?? [])
          const grupos = new Map()
          for (const h of data ?? []) {
            const cat = h.categoria ?? 'Otras'
            if (!grupos.has(cat)) grupos.set(cat, [])
            grupos.get(cat).push(h)
          }
          setPorCategoria([...grupos.entries()].map(([categoria, items]) => ({ categoria, items })))
        }
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return { habilidades, porCategoria, cargando, error }
}
