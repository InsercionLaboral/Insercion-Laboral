import { useMemo } from 'react'
import { Selector } from './ui/Selector.jsx'
import { useMunicipios } from '../hooks/useMunicipios.js'

/**
 * Selector de municipio con estados claros: mientras carga lo dice, y si no
 * hay conexión muestra un aviso con botón para reintentar (en vez de dejar la
 * lista vacía sin explicación).
 */
export function SelectorMunicipio({ placeholder = 'Selecciona tu municipio', ...props }) {
  const { municipios, cargando, error, reintentar } = useMunicipios()
  const opciones = useMemo(
    () => municipios.map((m) => ({ value: m.id, label: m.nombre })),
    [municipios],
  )
  const sinDatos = municipios.length === 0

  return (
    <div>
      <Selector
        id="municipio"
        etiqueta="Municipio"
        icono="📍"
        opciones={opciones}
        placeholder={cargando && sinDatos ? 'Cargando municipios…' : placeholder}
        disabled={sinDatos}
        {...props}
      />
      {sinDatos && !cargando && error && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-naranja/10 px-3 py-2">
          <p className="font-body text-xs text-[#B96C00]">
            No pudimos cargar los municipios. Revisa tu conexión a internet.
          </p>
          <button
            type="button"
            onClick={reintentar}
            className="shrink-0 rounded-full bg-tinta px-3 py-1.5 font-body text-xs font-bold text-white"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}
