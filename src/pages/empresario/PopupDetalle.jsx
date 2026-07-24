import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Cargando } from '../../components/Cargando.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { EstadoBadge } from '../../components/ui/EstadoBadge.jsx'
import { rangoFechas } from '../../lib/fechas.js'
import { construirEnlaceWa } from '../../lib/whatsapp.js'
import {
  actualizarEstadoPostulacion,
  cerrarPopup,
  getPopup,
  listarPostulantes,
} from '../../lib/popups.js'

const ACCIONES = [
  { estado: 'preseleccionado', texto: 'Preseleccionar', clase: 'bg-naranja/15 text-[#B96C00]' },
  { estado: 'contratado', texto: 'Contratar', clase: 'bg-tinta text-lima' },
  { estado: 'descartado', texto: 'Descartar', clase: 'bg-joven/10 text-joven' },
]

export function PopupDetalle() {
  const { popupId } = useParams()
  const [popup, setPopup] = useState(null)
  const [postulantes, setPostulantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ocupado, setOcupado] = useState(null)

  const cargar = useCallback(async () => {
    const [p, lista] = await Promise.all([getPopup(popupId), listarPostulantes(popupId)])
    setPopup(p)
    setPostulantes(lista)
  }, [popupId])

  useEffect(() => {
    cargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cargar])

  async function cambiarEstado(postulacionId, estado) {
    setOcupado(postulacionId)
    setError(null)
    try {
      await actualizarEstadoPostulacion(postulacionId, estado)
      setPostulantes((prev) =>
        prev.map((p) => (p.postulacion_id === postulacionId ? { ...p, estado } : p)),
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  async function onCerrar() {
    setError(null)
    try {
      await cerrarPopup(popupId)
      setPopup((p) => ({ ...p, estado: 'cerrado' }))
    } catch (e) {
      setError(e.message)
    }
  }

  if (cargando) return <Cargando />
  if (!popup) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-xl font-bold text-tinta">Pop-up no encontrado</h1>
        <Link to="/empresario/popups" className="mt-4 inline-block font-body text-sm font-bold text-empresario">
          ← Volver
        </Link>
      </div>
    )
  }

  const rango = rangoFechas(popup.fecha_inicio, popup.fecha_fin)

  return (
    <div className="py-2">
      <Link to="/empresario/popups" className="mb-3 inline-block font-body text-sm font-bold text-empresario">
        ← Mis pop-ups
      </Link>

      {/* Cabecera del pop-up */}
      <div className="rounded-3xl border border-borde bg-white p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h1 className="font-display text-xl font-bold leading-tight text-tinta">{popup.titulo}</h1>
          <EstadoBadge estado={popup.estado} />
        </div>
        <p className="font-body text-xs text-tenue">
          {popup.municipio ? `📍 ${popup.municipio}` : ''}
        </p>
        <p className="mt-3 font-body text-[14px] leading-relaxed text-[#3f4133]">
          {popup.descripcion}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 font-body text-[11.5px] font-bold text-tenue">
          {rango && <span className="rounded-full bg-fondo px-2.5 py-1">📅 {rango}</span>}
          {popup.cupos != null && (
            <span className="rounded-full bg-fondo px-2.5 py-1">👥 {popup.cupos} cupos</span>
          )}
          {popup.pago_estimado && (
            <span className="rounded-full bg-fondo px-2.5 py-1">💵 {popup.pago_estimado}</span>
          )}
        </div>

        {popup.habilidades?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {popup.habilidades.map((h, i) => (
              <Chip key={h.id} indice={i}>
                {h.nombre}
              </Chip>
            ))}
          </div>
        )}

        {popup.estado === 'aprobado' && (
          <button
            onClick={onCerrar}
            className="mt-4 rounded-2xl border border-borde bg-superficie px-4 py-2 font-body text-[13px] font-bold text-tenue"
          >
            Cerrar pop-up
          </button>
        )}
        {popup.estado === 'pendiente' && (
          <p className="mt-4 rounded-xl bg-naranja/10 px-3 py-2 font-body text-[12.5px] text-[#B96C00]">
            Este pop-up está esperando aprobación de un líder de área. Aún no es visible para los jóvenes.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {/* Postulantes */}
      <h2 className="mb-3 mt-6 font-display text-lg font-bold text-tinta">
        Postulaciones ({postulantes.length})
      </h2>

      {postulantes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-8 text-center">
          <p className="font-body text-sm text-tenue">Todavía no hay postulaciones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postulantes.map((p) => {
            const habs = Array.isArray(p.habilidades) ? p.habilidades : []
            const wa = construirEnlaceWa(
              p.telefono,
              `¡Hola ${p.nombre?.split(' ')[0] ?? ''}! Te escribo por tu postulación a "${popup.titulo}".`,
            )
            return (
              <div key={p.postulacion_id} className="rounded-2xl border border-borde bg-white p-4">
                <div className="flex items-center gap-3">
                  <Avatar nombre={p.nombre} fotoUrl={p.foto_url} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-semibold text-tinta">
                      {p.nombre}
                    </p>
                    <p className="font-body text-xs text-tenue">📍 {p.municipio ?? '—'}</p>
                  </div>
                  <EstadoBadge estado={p.estado} />
                </div>

                {habs.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {habs.slice(0, 3).map((h, i) => (
                      <Chip key={h.id} indice={i}>
                        {h.nombre}
                      </Chip>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/empresario/talento/${p.usuario_id}`}
                    className="rounded-full border border-borde px-3 py-1.5 font-body text-[12px] font-bold text-tinta"
                  >
                    Ver perfil
                  </Link>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-borde px-3 py-1.5 font-body text-[12px] font-bold text-tinta"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {ACCIONES.filter((a) => a.estado !== p.estado).map((a) => (
                    <button
                      key={a.estado}
                      onClick={() => cambiarEstado(p.postulacion_id, a.estado)}
                      disabled={ocupado === p.postulacion_id}
                      className={`rounded-full px-3 py-1.5 font-body text-[12px] font-bold disabled:opacity-50 ${a.clase}`}
                    >
                      {a.texto}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
