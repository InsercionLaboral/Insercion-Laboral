import { useEffect, useMemo, useState } from 'react'
import { Cargando } from '../../components/Cargando.jsx'
import { construirCsv, cargarKpi, descargarArchivo } from '../../lib/kpi.js'
import { hoyLocal, textoPermanencia } from '../../lib/fechas.js'

/** Dashboard de indicadores (admin / líder): por municipio, con exportación CSV y PDF. */
export function Dashboard() {
  const [kpi, setKpi] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [soloActividad, setSoloActividad] = useState(true)

  useEffect(() => {
    cargarKpi()
      .then(setKpi)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const filas = useMemo(() => {
    if (!kpi) return []
    const conActividad = kpi.municipios.filter(
      (m) => m.jovenes || m.empresarios || m.popups || m.postulaciones || m.contratacionesActivas,
    )
    const base = soloActividad && conActividad.length > 0 ? conActividad : kpi.municipios
    return [...base].sort(
      (a, b) => b.contratacionesActivas - a.contratacionesActivas || b.postulaciones - a.postulaciones || a.municipio.localeCompare(b.municipio),
    )
  }, [kpi, soloActividad])

  function exportarCsv() {
    descargarArchivo(`indicadores-insercion-laboral-${hoyLocal()}.csv`, construirCsv(kpi))
  }

  if (cargando) return <Cargando />

  if (error || !kpi) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-xl font-bold text-tinta">No pudimos cargar los indicadores</h1>
        <p className="mt-1 font-body text-sm text-tenue">{error ?? 'Inténtalo de nuevo en unos minutos.'}</p>
      </div>
    )
  }

  const { totales } = kpi
  const maxPostulaciones = Math.max(1, ...filas.map((m) => m.postulaciones))
  const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="py-2">
      {/* Encabezado visible solo al imprimir / guardar como PDF */}
      <div className="solo-impresion mb-4 border-b border-borde pb-3">
        <p className="font-display text-xl font-bold">Plataforma de Inserción Laboral — Comité de Cafeteros de Caldas</p>
        <p className="font-body text-sm">Reporte de indicadores · {fecha}</p>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-body text-xs text-tenue">Resumen general · {fecha}</p>
          <h1 className="font-display text-2xl font-bold text-tinta">Indicadores</h1>
        </div>
        <div className="no-imprimir flex gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            className="rounded-2xl border border-borde bg-white px-4 py-2.5 font-display text-sm font-semibold text-tinta"
          >
            ⬇ Descargar CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-2xl bg-tinta px-4 py-2.5 font-display text-sm font-semibold text-white"
          >
            🖨 Guardar como PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tarjeta valor={totales.jovenes} texto="Jóvenes activos" color="bg-joven" />
        <Tarjeta valor={totales.empresarios} texto="Empresarios" color="bg-empresario" />
        <Tarjeta valor={totales.popups} texto="Pop-ups publicados" color="bg-naranja" />
        <Tarjeta valor={totales.postulaciones} texto="Postulaciones" color="bg-tinta" />
        <Tarjeta valor={totales.contratacionesActivas} texto="Contrataciones activas" color="bg-[#2FB863]" />
        <Tarjeta valor={`${String(totales.tasa).replace('.', ',')} %`} texto="Tasa de contratación" color="bg-lima" oscuro />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Secundaria valor={totales.contratacionesTotales} texto="Contrataciones registradas" />
        <Secundaria valor={totales.contratacionesFinalizadas} texto="Vinculaciones finalizadas" />
        <Secundaria
          valor={totales.permanenciaPromedioDias == null ? '—' : textoPermanencia(totales.permanenciaPromedioDias)}
          texto="Permanencia promedio"
        />
        <Secundaria valor={`${totales.inscripciones} / ${totales.recursos}`} texto="Inscripciones / recursos" />
      </div>
      <p className="mt-2 font-body text-[11.5px] text-tenue">
        La tasa de contratación es el número de contrataciones activas por cada 100 postulaciones.
      </p>

      <div className="mb-3 mt-7 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-tinta">Por municipio</h2>
        <label className="no-imprimir flex items-center gap-2 font-body text-[13px] font-bold text-tenue">
          <input
            type="checkbox"
            checked={soloActividad}
            onChange={(e) => setSoloActividad(e.target.checked)}
            className="size-4 accent-[#E6007E]"
          />
          Solo municipios con actividad
        </label>
      </div>

      <div className="space-y-2 lg:hidden">
        {filas.map((m) => (
          <div key={m.municipio} className="rounded-2xl border border-borde bg-white p-3.5">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-semibold text-tinta">{m.municipio}</p>
              <span className="font-body text-xs font-bold text-tenue">{String(m.tasa).replace('.', ',')} %</span>
            </div>
            <Barra postulaciones={m.postulaciones} activas={m.contratacionesActivas} max={maxPostulaciones} />
            <p className="mt-1.5 font-body text-[12px] text-tenue">
              {m.jovenes} jóvenes · {m.empresarios} empresarios · {m.popups} pop-ups · {m.postulaciones} postulaciones ·{' '}
              {m.contratacionesActivas} contratados
            </p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-borde bg-white lg:block print:overflow-visible">
        <table className="w-full text-left font-body text-[13px]">
          <thead className="bg-fondo text-[11.5px] uppercase tracking-wide text-tenue">
            <tr>
              <th className="px-4 py-3">Municipio</th>
              <th className="px-3 py-3 text-right">Jóvenes</th>
              <th className="px-3 py-3 text-right">Empresarios</th>
              <th className="px-3 py-3 text-right">Pop-ups</th>
              <th className="px-3 py-3 text-right">Postulaciones</th>
              <th className="px-3 py-3 text-right">Contratados</th>
              <th className="px-3 py-3 text-right">Tasa</th>
              <th className="no-imprimir w-48 px-4 py-3">Comparativo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((m) => (
              <tr key={m.municipio} className="border-t border-borde">
                <td className="px-4 py-2.5 font-bold text-tinta">{m.municipio}</td>
                <td className="px-3 py-2.5 text-right">{m.jovenes}</td>
                <td className="px-3 py-2.5 text-right">{m.empresarios}</td>
                <td className="px-3 py-2.5 text-right">{m.popups}</td>
                <td className="px-3 py-2.5 text-right">{m.postulaciones}</td>
                <td className="px-3 py-2.5 text-right font-bold">{m.contratacionesActivas}</td>
                <td className="px-3 py-2.5 text-right">{String(m.tasa).replace('.', ',')} %</td>
                <td className="no-imprimir px-4 py-2.5">
                  <Barra postulaciones={m.postulaciones} activas={m.contratacionesActivas} max={maxPostulaciones} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="no-imprimir mt-2 flex items-center gap-4 font-body text-[11.5px] text-tenue">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-empresario/50" /> Postulaciones
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-[#2FB863]" /> Contrataciones activas
        </span>
      </p>
    </div>
  )
}

function Tarjeta({ valor, texto, color, oscuro = false }) {
  return (
    <div className={`rounded-2xl p-4 ${color} ${oscuro ? 'text-tinta' : 'text-white'}`}>
      <p className="font-display text-3xl font-bold leading-none">{valor}</p>
      <p className="mt-1.5 font-body text-[12.5px] font-bold opacity-90">{texto}</p>
    </div>
  )
}

function Secundaria({ valor, texto }) {
  return (
    <div className="rounded-2xl border border-borde bg-white p-3.5">
      <p className="font-display text-xl font-bold text-tinta">{valor}</p>
      <p className="font-body text-[11.5px] font-bold text-tenue">{texto}</p>
    </div>
  )
}

/** Barra comparativa: postulaciones (fondo) y contrataciones activas (encima). */
function Barra({ postulaciones, activas, max }) {
  const pPost = Math.round((postulaciones / max) * 100)
  const pAct = Math.round((activas / max) * 100)
  return (
    <div
      className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-borde"
      role="img"
      aria-label={`${postulaciones} postulaciones, ${activas} contrataciones activas`}
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-empresario/50" style={{ width: `${pPost}%` }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-[#2FB863]" style={{ width: `${pAct}%` }} />
    </div>
  )
}
