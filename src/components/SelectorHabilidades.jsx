import { useState } from 'react'
import { useHabilidades } from '../hooks/useHabilidades.js'
import { ChipSolido } from './ui/Chip.jsx'

/**
 * Selector de habilidades del catálogo. Muestra las seleccionadas como chips y
 * abre un panel agrupado por categoría para agregar/quitar.
 * Props: `seleccionadas` (array de ids), `onCambio` (nuevo array de ids).
 */
export function SelectorHabilidades({ seleccionadas, onCambio }) {
  const { habilidades, porCategoria, cargando } = useHabilidades()
  const [abierto, setAbierto] = useState(false)

  const set = new Set(seleccionadas)
  const alternar = (id) => {
    const nuevo = new Set(set)
    if (nuevo.has(id)) nuevo.delete(id)
    else nuevo.add(id)
    onCambio([...nuevo])
  }

  const seleccion = habilidades.filter((h) => set.has(h.id))

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {seleccion.map((h) => (
          <ChipSolido key={h.id} onQuitar={() => alternar(h.id)}>
            {h.nombre}
          </ChipSolido>
        ))}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#C9CBB6] bg-white px-3 py-1.5 font-body text-[12.5px] font-bold text-tenue"
        >
          {abierto ? 'Cerrar' : '+ Agregar'}
        </button>
      </div>

      {abierto && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-borde bg-white p-3">
          {cargando ? (
            <p className="py-4 text-center font-body text-sm text-tenue">Cargando habilidades…</p>
          ) : (
            porCategoria.map((grupo) => (
              <div key={grupo.categoria} className="mb-3 last:mb-0">
                <p className="mb-2 font-body text-[11px] font-bold uppercase tracking-wide text-tenue">
                  {grupo.categoria}
                </p>
                <div className="flex flex-wrap gap-2">
                  {grupo.items.map((h) => {
                    const activa = set.has(h.id)
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => alternar(h.id)}
                        className={`rounded-full px-3 py-1.5 font-body text-[12px] font-semibold transition ${
                          activa
                            ? 'bg-tinta text-white'
                            : 'bg-fondo text-tinta hover:bg-lima/30'
                        }`}
                      >
                        {activa ? '✓ ' : ''}
                        {h.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
