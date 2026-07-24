import { Link } from 'react-router-dom'
import { EstadoBadge } from './ui/EstadoBadge.jsx'
import { Chip } from './ui/Chip.jsx'
import { rangoFechas } from '../lib/fechas.js'

/**
 * Tarjeta de pop-up para listados. `pie` permite inyectar contenido extra
 * (p. ej. el conteo de postulaciones o el estado de mi postulación).
 */
export function PopupCard({ popup, to, mostrarEstado = false, pie = null }) {
  const rango = rangoFechas(popup.fecha_inicio, popup.fecha_fin)
  const habs = popup.habilidades ?? []

  return (
    <Link to={to} className="block rounded-2xl border border-borde bg-white p-4">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <h3 className="font-display text-[16px] font-semibold leading-tight text-tinta">
          {popup.titulo}
        </h3>
        {mostrarEstado && <EstadoBadge estado={popup.estado} />}
      </div>

      <p className="font-body text-xs text-tenue">
        {popup.empresa ?? 'Empresa'}
        {popup.municipio ? ` · 📍 ${popup.municipio}` : ''}
      </p>

      <div className="mt-2 flex flex-wrap gap-2 font-body text-[11.5px] font-bold text-tenue">
        {rango && <span className="rounded-full bg-fondo px-2.5 py-1">📅 {rango}</span>}
        {popup.cupos != null && (
          <span className="rounded-full bg-fondo px-2.5 py-1">👥 {popup.cupos} cupos</span>
        )}
        {popup.pago_estimado && (
          <span className="rounded-full bg-fondo px-2.5 py-1">💵 {popup.pago_estimado}</span>
        )}
      </div>

      {habs.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {habs.slice(0, 2).map((h, i) => (
            <Chip key={h.id} indice={i}>
              {h.nombre}
            </Chip>
          ))}
          {habs.length > 2 && (
            <span className="rounded-full bg-fondo px-2.5 py-1 font-body text-[11px] font-bold text-tenue">
              +{habs.length - 2}
            </span>
          )}
        </div>
      )}

      {pie && <div className="mt-3 border-t border-borde pt-2.5">{pie}</div>}
    </Link>
  )
}
