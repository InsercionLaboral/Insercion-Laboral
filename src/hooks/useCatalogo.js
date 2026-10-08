import { useCallback, useEffect, useRef, useState } from 'react'

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // los catálogos casi no cambian
const INTENTOS = 3

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function leerCache(clave) {
  try {
    const raw = localStorage.getItem(clave)
    if (!raw) return null
    const { t, data } = JSON.parse(raw)
    if (!Array.isArray(data) || Date.now() - t > TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function guardarCache(clave, data) {
  try {
    localStorage.setItem(clave, JSON.stringify({ t: Date.now(), data }))
  } catch {
    /* sin almacenamiento disponible: se ignora */
  }
}

/**
 * Carga un catálogo (municipios, habilidades…) pensado para conexiones
 * inestables: muestra al instante la copia guardada en el dispositivo, reintenta
 * con espera creciente si la red falla y expone `reintentar()` para la UI.
 */
export function useCatalogo(clave, cargarFn) {
  const [datos, setDatos] = useState(() => leerCache(clave) ?? [])
  const [cargando, setCargando] = useState(() => leerCache(clave) === null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const cargarRef = useRef(cargarFn)

  useEffect(() => {
    cargarRef.current = cargarFn
  })

  useEffect(() => {
    let activo = true
    ;(async () => {
      setError(null)
      for (let i = 0; i < INTENTOS; i++) {
        try {
          const data = await cargarRef.current()
          if (!activo) return
          setDatos(data)
          guardarCache(clave, data)
          setCargando(false)
          return
        } catch (e) {
          if (!activo) return
          if (i === INTENTOS - 1) {
            setError(e.message || 'No se pudo cargar la información.')
            setCargando(false)
          } else {
            await esperar(800 * (i + 1))
          }
        }
      }
    })()
    return () => {
      activo = false
    }
  }, [clave, intento])

  const reintentar = useCallback(() => {
    setCargando(true)
    setIntento((n) => n + 1)
  }, [])

  return { datos, cargando, error, reintentar }
}
