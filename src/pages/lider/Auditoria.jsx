import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando } from '../../components/Cargando.jsx'
import { EstadoBadge } from '../../components/ui/EstadoBadge.jsx'
import { listarAuditoria } from '../../lib/aprobaciones.js'

function fechaLegible(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Historial básico de revisiones: qué se revisó, en qué quedó y quién lo hizo. */
export function Auditoria() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listarAuditoria()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <Link to="/lider" className="mb-3 inline-block font-body text-sm font-bold text-empresario">
        ← Aprobaciones
      </Link>
      <h1 className="mb-1 font-display text-2xl font-bold text-tinta">Historial de revisiones</h1>
      <p className="mb-4 font-body text-sm text-tenue">Quién aprobó o rechazó qué, y cuándo.</p>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <p className="font-body text-sm text-tenue">Todavía no hay revisiones registradas.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-2xl border border-borde bg-white p-3.5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fondo text-lg">
                {it.tipo === 'Perfil' ? '👤' : '⚡'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[14.5px] font-semibold text-tinta">
                  {it.titulo}
                </p>
                <p className="font-body text-[11.5px] text-tenue">
                  {it.tipo} · {fechaLegible(it.fecha)} · por {it.revisor}
                </p>
              </div>
              <EstadoBadge estado={it.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
