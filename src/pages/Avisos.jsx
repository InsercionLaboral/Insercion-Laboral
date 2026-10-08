import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cargando } from '../components/Cargando.jsx'
import { haceCuanto, listarAvisos, marcarLeido, marcarTodosLeidos } from '../lib/avisos.js'

const ICONO = {
  perfil_aprobado: '🎉',
  perfil_rechazado: '✏️',
  perfil_por_revisar: '👤',
  popup_aprobado: '✅',
  popup_rechazado: '✏️',
  popup_por_revisar: '⚡',
  popup_nuevo: '⚡',
  postulacion_nueva: '📨',
  postulacion_estado: '🤝',
  recurso_nuevo: '📚',
}

/** Avisos de la plataforma (para todos los roles). */
export function Avisos() {
  const navigate = useNavigate()
  const [avisos, setAvisos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => setAvisos(await listarAvisos()), [])

  useEffect(() => {
    cargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cargar])

  async function abrir(a) {
    try {
      if (!a.leida) await marcarLeido(a.id)
    } catch {
      /* si falla marcarlo, igual se abre */
    }
    if (a.enlace) navigate(a.enlace)
    else setAvisos((prev) => prev.map((x) => (x.id === a.id ? { ...x, leida: true } : x)))
  }

  async function leerTodos() {
    setError(null)
    try {
      await marcarTodosLeidos()
      setAvisos((prev) => prev.map((x) => ({ ...x, leida: true })))
      window.dispatchEvent(new Event('avisos-leidos'))
    } catch (e) {
      setError(e.message)
    }
  }

  if (cargando) return <Cargando />

  const sinLeer = avisos.filter((a) => !a.leida).length

  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-tinta">Avisos</h1>
        {sinLeer > 0 && (
          <button type="button" onClick={leerTodos} className="font-body text-[13px] font-bold text-empresario">
            Marcar todo como leído
          </button>
        )}
      </div>
      <p className="mb-4 font-body text-sm text-tenue">
        Aquí te contamos lo que pasa con tu cuenta: aprobaciones, postulaciones y novedades.
      </p>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">{error}</p>
      )}

      {avisos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <div className="mb-2 text-3xl">🔔</div>
          <p className="font-body text-sm text-tenue">Todavía no tienes avisos.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {avisos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => abrir(a)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left ${
                a.leida ? 'border-borde bg-white/70' : 'border-empresario/40 bg-white shadow-sm'
              }`}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fondo text-xl">
                {ICONO[a.tipo] ?? '🔔'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-display text-[14.5px] font-semibold text-tinta">{a.titulo}</span>
                  {!a.leida && <span className="size-2 shrink-0 rounded-full bg-joven" aria-label="Sin leer" />}
                </span>
                {a.mensaje && (
                  <span className="mt-0.5 block font-body text-[13px] leading-snug text-[#3f4133]">{a.mensaje}</span>
                )}
                <span className="mt-1 block font-body text-[11.5px] text-tenue">{haceCuanto(a.created_at)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
