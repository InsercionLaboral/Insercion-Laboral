// Paletas suaves para las etiquetas de habilidad (rotan por índice), inspiradas
// en el mockup (lima, rosa, turquesa, naranja).
const PALETAS = [
  'bg-lima/25 text-[#5d6c17]',
  'bg-joven/12 text-[#B0075E]',
  'bg-empresario/12 text-[#0a7c84]',
  'bg-naranja/15 text-[#B96C00]',
]

/** Etiqueta de habilidad. `indice` elige el color; `onQuitar` la hace removible. */
export function Chip({ children, indice = 0, onQuitar }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12.5px] font-bold ${PALETAS[indice % PALETAS.length]}`}
    >
      {children}
      {onQuitar && (
        <button type="button" onClick={onQuitar} className="opacity-70 hover:opacity-100" aria-label="Quitar">
          ✕
        </button>
      )}
    </span>
  )
}

/** Chip oscuro (seleccionado) para el selector de habilidades. */
export function ChipSolido({ children, onQuitar }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-tinta px-3 py-1.5 font-body text-[12.5px] font-semibold text-white">
      {children}
      {onQuitar && (
        <button type="button" onClick={onQuitar} className="opacity-80 hover:opacity-100" aria-label="Quitar">
          ✕
        </button>
      )}
    </span>
  )
}
