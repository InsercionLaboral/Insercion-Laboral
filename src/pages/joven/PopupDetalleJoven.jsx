import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { Boton } from '../../components/ui/Boton.jsx'
import { EstadoBadge } from '../../components/ui/EstadoBadge.jsx'
import { getMiPerfil } from '../../lib/perfil.js'
import { getPopup, misPostulaciones, postularse } from '../../lib/popups.js'
import { diasRestantes, duracionDias, rangoFechas } from '../../lib/fechas.js'

export function PopupDetalleJoven() {
  const { popupId } = useParams()
  const { usuario } = useAuth()

  const [cargando, setCargando] = useState(true)
  const [popup, setPopup] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [misHabilidades, setMisHabilidades] = useState(new Set())
  const [estadoPostulacion, setEstadoPostulacion] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!usuario) return
    ;(async () => {
      const [p, mio] = await Promise.all([getPopup(popupId), getMiPerfil(usuario.id)])
      setPopup(p)
      setPerfil(mio.perfil)
      setMisHabilidades(new Set(mio.habilidadIds))
      if (mio.perfil) {
        const posts = await misPostulaciones(mio.perfil.id)
        const mia = posts.find((x) => x.popup_id === popupId)
        if (mia) setEstadoPostulacion(mia.estado)
      }
    })()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [popupId, usuario])

  async function onPostularme() {
    setError(null)
    setEnviando(true)
    try {
      await postularse({ popupId, jovenId: perfil.id })
      setEstadoPostulacion('enviada')
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Cargando />
  if (!popup) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-xl font-bold text-tinta">Pop-up no disponible</h1>
        <Link to="/joven/popups" className="mt-4 inline-block font-body text-sm font-bold text-empresario">
          ← Volver a pop-ups
        </Link>
      </div>
    )
  }

  const req = popup.habilidades ?? []
  const coinciden = req.filter((h) => misHabilidades.has(h.id)).length
  const rango = rangoFechas(popup.fecha_inicio, popup.fecha_fin)
  const dias = duracionDias(popup.fecha_inicio, popup.fecha_fin)
  const restantes = diasRestantes(popup.fecha_cierre)

  return (
    <div className="py-2">
      <Link to="/joven/popups" className="mb-3 inline-block font-body text-sm font-bold text-empresario">
        ← Pop-ups
      </Link>

      <div className="overflow-hidden rounded-3xl border border-borde bg-superficie">
        {/* Hero */}
        <div className="bg-lima px-5 pb-6 pt-5">
          {restantes != null && restantes >= 0 && (
            <span className="mb-2.5 inline-flex rounded-full bg-tinta px-3 py-1 font-body text-[11.5px] font-bold text-naranja">
              ⚡ POP-UP · {restantes === 0 ? 'CIERRA HOY' : `CIERRA EN ${restantes} DÍA${restantes === 1 ? '' : 'S'}`}
            </span>
          )}
          <h1 className="font-display text-2xl font-bold leading-tight text-tinta">{popup.titulo}</h1>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-lg">🌱</span>
            <div className="font-body text-[13px] font-bold text-[#3f4326]">
              {popup.empresa ?? 'Empresa'}
              <span className="block font-semibold text-[#5d6c17]">
                {popup.municipio ?? 'Caldas'}
              </span>
            </div>
          </div>
        </div>

        {/* Datos clave */}
        <div className="grid grid-cols-3 gap-2.5 px-5 pt-4">
          <Dato emoji="📅" valor={dias ? `${dias} días` : '—'} detalle={rango ?? 'Por definir'} />
          <Dato emoji="👥" valor={popup.cupos != null ? `${popup.cupos} cupos` : '—'} detalle="disponibles" />
          <Dato emoji="💵" valor={popup.pago_estimado ?? '—'} detalle="pago estimado" />
        </div>

        <div className="px-5 py-5">
          <h2 className="mb-2 font-display text-[15px] font-semibold text-tinta">La oportunidad</h2>
          <p className="mb-5 font-body text-[14px] leading-relaxed text-[#3f4133]">
            {popup.descripcion}
          </p>

          {req.length > 0 && (
            <>
              <h2 className="mb-2.5 font-display text-[15px] font-semibold text-tinta">
                Habilidades que buscan
              </h2>
              <div className="mb-4 flex flex-wrap gap-2">
                {req.map((h) => {
                  const tengo = misHabilidades.has(h.id)
                  return (
                    <span
                      key={h.id}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-[12.5px] font-bold ${
                        tengo
                          ? 'border-[#E1EDAE] bg-[#F4F9D9] text-[#5d6c17]'
                          : 'border-borde bg-white text-tenue'
                      }`}
                    >
                      {tengo ? '✓' : '○'} {h.nombre}
                    </span>
                  )
                })}
              </div>

              {perfil && (
                <div
                  className={`flex items-center gap-2.5 rounded-2xl border p-3.5 ${
                    coinciden > 0
                      ? 'border-[#E1EDAE] bg-[#F4F9D9] text-[#5d6c17]'
                      : 'border-borde bg-white text-tenue'
                  }`}
                >
                  <span className="text-xl">{coinciden > 0 ? '✨' : '💡'}</span>
                  <p className="font-body text-[12.5px] font-bold leading-snug">
                    {coinciden > 0
                      ? `¡Coincides en ${coinciden} de ${req.length} habilidades! Buen match.`
                      : 'Aún no coincides con estas habilidades, pero puedes postularte igual.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-borde bg-white px-5 py-4">
          {error && (
            <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
              {error}
            </p>
          )}

          {!perfil ? (
            <div className="text-center">
              <p className="mb-3 font-body text-[13px] text-tenue">
                Necesitas un perfil para postularte.
              </p>
              <Link
                to="/joven/perfil"
                className="inline-block rounded-2xl bg-joven px-5 py-3 font-display font-semibold text-white"
              >
                Crear mi perfil
              </Link>
            </div>
          ) : estadoPostulacion ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-fondo px-4 py-3.5">
              <span className="font-body text-[13.5px] font-bold text-tinta">Ya te postulaste</span>
              <EstadoBadge estado={estadoPostulacion} />
            </div>
          ) : popup.estado !== 'aprobado' ? (
            <p className="text-center font-body text-[13px] text-tenue">
              Este pop-up ya no recibe postulaciones.
            </p>
          ) : (
            <Boton variante="joven" cargando={enviando} onClick={onPostularme}>
              Postularme →
            </Boton>
          )}
        </div>
      </div>
    </div>
  )
}

function Dato({ emoji, valor, detalle }) {
  return (
    <div className="rounded-2xl border border-borde bg-white px-2 py-3 text-center">
      <div className="text-lg">{emoji}</div>
      <div className="mt-0.5 font-display text-[13px] font-bold text-tinta">{valor}</div>
      <div className="font-body text-[10.5px] text-tenue">{detalle}</div>
    </div>
  )
}
