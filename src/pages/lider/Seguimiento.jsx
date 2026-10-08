import { useEffect, useMemo, useState } from 'react'
import { Cargando } from '../../components/Cargando.jsx'
import { TarjetaContratacion } from '../../components/TarjetaContratacion.jsx'
import { listarContratacionesStaff, requiereSeguimiento } from '../../lib/contrataciones.js'

const FILTROS = [
  { clave: 'todas', texto: 'Todas' },
  { clave: 'activas', texto: 'Vinculadas' },
  { clave: 'pendientes', texto: 'Sin seguimiento' },
  { clave: 'finalizadas', texto: 'Finalizadas' },
]

/** Vista de líder y admin: todas las contrataciones y su estado de seguimiento. */
export function Seguimiento() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    listarContratacionesStaff()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return items.filter((c) => {
      if (filtro === 'activas' && !c.activo) return false
      if (filtro === 'finalizadas' && c.activo) return false
      if (filtro === 'pendientes' && !requiereSeguimiento(c)) return false
      if (!q) return true
      return [c.joven, c.empresa, c.popup, c.municipio].some((v) => v?.toLowerCase().includes(q))
    })
  }, [items, filtro, busqueda])

  if (cargando) return <Cargando />

  const activas = items.filter((c) => c.activo).length
  const pendientes = items.filter((c) => requiereSeguimiento(c)).length

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Seguimiento</h1>
      <p className="mb-4 mt-1 font-body text-sm text-tenue">
        Las contrataciones registradas por los empresarios y cómo van.
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2.5 text-center">
        <Resumen valor={items.length} texto="Contrataciones" />
        <Resumen valor={activas} texto="Vinculadas" />
        <Resumen valor={pendientes} texto="Sin seguimiento" resaltar={pendientes > 0} />
      </div>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por joven, empresa, pop-up o municipio"
        aria-label="Buscar contrataciones"
        className="mb-3 w-full rounded-2xl border border-borde bg-white px-4 py-3 font-body text-[14px] text-tinta outline-none"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            type="button"
            onClick={() => setFiltro(f.clave)}
            className={`rounded-full px-3.5 py-1.5 font-body text-[12.5px] font-bold ${
              filtro === f.clave ? 'bg-tinta text-white' : 'border border-borde bg-white text-tenue'
            }`}
          >
            {f.texto}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <p className="font-body text-sm text-tenue">
            {items.length === 0
              ? 'Todavía no hay contrataciones registradas.'
              : 'No hay contrataciones con ese filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((c) => (
            <TarjetaContratacion key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function Resumen({ valor, texto, resaltar = false }) {
  return (
    <div className={`rounded-2xl border px-2 py-3 ${resaltar ? 'border-naranja/40 bg-naranja/10' : 'border-borde bg-white'}`}>
      <p className="font-display text-2xl font-bold text-tinta">{valor}</p>
      <p className="font-body text-[11.5px] font-bold text-tenue">{texto}</p>
    </div>
  )
}
