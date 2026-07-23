import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Carga el catálogo de municipios (lectura pública por RLS). Se usa en el
 * registro y en los filtros del directorio.
 */
export function useMunicipios() {
  const [municipios, setMunicipios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    supabase
      .from('municipios')
      .select('id, nombre')
      .order('nombre')
      .then(({ data, error }) => {
        if (!activo) return
        if (error) setError(error.message)
        else setMunicipios(data ?? [])
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return { municipios, cargando, error }
}
