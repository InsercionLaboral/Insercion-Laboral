import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMunicipios } from '../../hooks/useMunicipios.js'
import { useHabilidades } from '../../hooks/useHabilidades.js'
import { buscarDirectorio } from '../../lib/perfil.js'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Chip } from '../../components/ui/Chip.jsx'

export function Directorio() {
  const { municipios } = useMunicipios()
  const { habilidades } = useHabilidades()

  const [busqueda, setBusqueda] = useState('')
  const [habilidadId, setHabilidadId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(false)

  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const opcMunicipio = useMemo(
    () => municipios.map((m) => ({ value: m.id, label: m.nombre })),
    [municipios],
  )
  const opcHabilidad = useMemo(
    () => habilidades.map((h) => ({ value: h.id, label: h.nombre })),
    [habilidades],
  )

  useEffect(() => {
    let activo = true
    setCargando(true)
    const t = setTimeout(() => {
      buscarDirectorio({ busqueda, habilidadId, municipioId, soloDisponibles })
        .then((data) => {
          if (activo) setResultados(data)
        })
        .catch((e) => {
          if (activo) setError(e.message)
        })
        .finally(() => {
          if (activo) setCargando(false)
        })
    }, 300)
    return () => {
      activo = false
      clearTimeout(t)
    }
  }, [busqueda, habilidadId, municipioId, soloDisponibles])

  return (
    <div className="py-2">
      <p className="font-body text-xs text-tenue">Buscar talento</p>
      <h1 className="mb-4 font-display text-2xl font-bold text-tinta">Directorio</h1>

      {/* Búsqueda */}
      <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-borde bg-white px-3.5 py-3">
        <span>🔎</span>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Habilidad, nombre, oficio…"
          className="min-w-0 flex-1 bg-transparent font-body text-[14.5px] text-tinta outline-none"
        />
      </div>

      {/* Filtros */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={habilidadId}
          onChange={(e) => setHabilidadId(e.target.value)}
          className="rounded-full border border-borde bg-white px-3 py-2 font-body text-[12.5px] font-bold text-tinta outline-none"
        >
          <option value="">Habilidad ▾</option>
          {opcHabilidad.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={municipioId}
          onChange={(e) => setMunicipioId(e.target.value)}
          className="rounded-full border border-borde bg-white px-3 py-2 font-body text-[12.5px] font-bold text-tinta outline-none"
        >
          <option value="">📍 Municipio ▾</option>
          {opcMunicipio.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setSoloDisponibles((v) => !v)}
          className={`rounded-full px-3.5 py-2 font-body text-[12.5px] font-bold ${
            soloDisponibles ? 'bg-lima text-tinta' : 'border border-borde bg-white text-tinta'
          }`}
        >
          {soloDisponibles ? '✓ Solo disponibles' : 'Solo disponibles'}
        </button>
        {(habilidadId || municipioId || busqueda) && (
          <button
            onClick={() => {
              setBusqueda('')
              setHabilidadId('')
              setMunicipioId('')
            }}
            className="font-body text-[12.5px] font-bold text-tenue"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      <p className="mb-3 font-body text-[12.5px] font-bold text-tenue">
        {cargando ? 'Buscando…' : `${resultados.length} ${resultados.length === 1 ? 'joven encontrado' : 'jóvenes encontrados'}`}
      </p>

      {!cargando && resultados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <p className="font-body text-sm text-tenue">
            No hay jóvenes que coincidan con estos filtros.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {resultados.map((j) => {
          const habs = Array.isArray(j.habilidades) ? j.habilidades : []
          return (
            <Link
              key={j.usuario_id}
              to={`/empresario/talento/${j.usuario_id}`}
              className={`flex items-center gap-3 rounded-2xl border border-borde bg-white p-3.5 ${
                j.disponible ? '' : 'opacity-70'
              }`}
            >
              <div className="relative shrink-0">
                <Avatar nombre={j.nombre} fotoUrl={j.foto_url} className="size-14" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-white ${
                    j.disponible ? 'bg-[#2FB863]' : 'bg-tenue'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15.5px] font-semibold text-tinta">
                  {j.nombre}
                </p>
                <p className="mb-1.5 font-body text-xs text-tenue">📍 {j.municipio ?? '—'}</p>
                <div className="flex flex-wrap gap-1.5">
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
              </div>
              <span className="text-xl text-[#c9cbb6]">→</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
