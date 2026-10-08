import { useEffect, useState } from 'react'
import { listarProyectosDeUsuario } from '../lib/proyectos.js'

/** Proyectos destacados de un joven (vacío si aún no hay o la sección no está disponible). */
export function useProyectos(usuarioId) {
  const [proyectos, setProyectos] = useState([])

  useEffect(() => {
    if (!usuarioId) return
    let activo = true
    listarProyectosDeUsuario(usuarioId)
      .then(({ items }) => activo && setProyectos(items))
      .catch(() => activo && setProyectos([]))
    return () => {
      activo = false
    }
  }, [usuarioId])

  return proyectos
}
