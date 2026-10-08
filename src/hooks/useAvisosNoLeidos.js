import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { contarNoLeidos } from '../lib/avisos.js'

const CADA_MS = 60_000

/**
 * Cantidad de avisos sin leer. Se actualiza al cambiar de pantalla y cada
 * minuto (consulta liviana: solo el número). null = avisos no disponibles.
 */
export function useAvisosNoLeidos() {
  const { pathname } = useLocation()
  const [cantidad, setCantidad] = useState(null)

  useEffect(() => {
    let activo = true
    const consultar = () =>
      contarNoLeidos()
        .then((n) => activo && setCantidad(n))
        .catch(() => {})
    consultar()
    const t = setInterval(consultar, CADA_MS)
    window.addEventListener('avisos-leidos', consultar)
    return () => {
      activo = false
      clearInterval(t)
      window.removeEventListener('avisos-leidos', consultar)
    }
  }, [pathname])

  return cantidad
}
