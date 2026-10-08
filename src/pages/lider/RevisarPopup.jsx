import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { DialogoMotivo } from '../../components/DialogoMotivo.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { EstadoBadge } from '../../components/ui/EstadoBadge.jsx'
import { getPopup } from '../../lib/popups.js'
import { revisarPopup } from '../../lib/aprobaciones.js'
import { rangoFechas } from '../../lib/fechas.js'

/** Revisión en detalle de un pop-up, con aprobar/rechazar. */
export function RevisarPopup() {
  const { popupId } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [popup, setPopup] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false)

  useEffect(() => {
    getPopup(popupId)
      .then(setPopup)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [popupId])

  async function decidir(aprobado, motivo = null) {
    setOcupado(true)
    setError(null)
    try {
      await revisarPopup({ popupId, aprobado, revisorId: usuario.id, motivo })
      navigate('/lider', { replace: true })
    } catch (e) {
      setError(e.message)
      setOcupado(false)
    }
  }

  if (cargando) return <Cargando />
  if (!popup) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-xl font-bold text-tinta">Pop-up no encontrado</h1>
        <Link to="/lider" className="mt-4 inline-block font-body text-sm font-bold text-empresario">
          ← Volver a aprobaciones
        </Link>
      </div>
    )
  }

  const rango = rangoFechas(popup.fecha_inicio, popup.fecha_fin)

  return (
    <div className="py-2">
      <DialogoMotivo
        abierto={pidiendoMotivo}
        titulo={`Rechazar “${popup.titulo}”`}
        ayuda="Cuéntale al empresario qué debe ajustar. Lo verá en su pop-up y en sus avisos."
        ocupado={ocupado}
        onCancelar={() => setPidiendoMotivo(false)}
        onConfirmar={(motivo) => {
          setPidiendoMotivo(false)
          decidir(false, motivo)
        }}
      />
      <Link to="/lider" className="mb-3 inline-block font-body text-sm font-bold text-empresario">
        ← Aprobaciones
      </Link>

      <div className="rounded-3xl border border-borde bg-white p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h1 className="font-display text-xl font-bold leading-tight text-tinta">{popup.titulo}</h1>
          <EstadoBadge estado={popup.estado} />
        </div>
        <p className="font-body text-xs text-tenue">
          {popup.empresa} {popup.municipio ? `· 📍 ${popup.municipio}` : ''}
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
          <div className="mt-3">
            <p className="mb-2 font-body text-[13px] font-bold text-tinta">Habilidades requeridas</p>
            <div className="flex flex-wrap gap-2">
              {popup.habilidades.map((h, i) => (
                <Chip key={h.id} indice={i}>
                  {h.nombre}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {popup.estado === 'pendiente' ? (
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => setPidiendoMotivo(true)}
            disabled={ocupado}
            className="flex-1 rounded-xl border border-[#F1B5B5] bg-white py-3 font-body text-[14px] font-bold text-[#C23B3B] disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => decidir(true)}
            disabled={ocupado}
            className="flex-[1.4] rounded-xl bg-[#2FB863] py-3 font-display text-[14px] font-semibold text-white disabled:opacity-50"
          >
            ✓ Aprobar y publicar
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-fondo px-3 py-2.5 text-center font-body text-[13px] text-tenue">
          Este pop-up ya fue revisado (estado: {popup.estado}).
        </p>
      )}
    </div>
  )
}
