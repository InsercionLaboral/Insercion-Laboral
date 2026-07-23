import { Link } from 'react-router-dom'

/**
 * Cabecera de formulario multipaso: botón atrás, barra de progreso y "n / total".
 * `onAtras` puede ser una función (paso anterior) o, si es null, usa `volverA`.
 */
export function BarraPasos({ paso, total, acento = 'joven', onAtras, volverA = '/' }) {
  const color = acento === 'empresario' ? 'bg-empresario' : 'bg-joven'
  const boton = (
    <span className="flex size-10 items-center justify-center rounded-xl border border-borde bg-white text-xl">
      ←
    </span>
  )
  return (
    <div className="flex items-center gap-3.5 py-2">
      {onAtras ? (
        <button type="button" onClick={onAtras} aria-label="Atrás">
          {boton}
        </button>
      ) : (
        <Link to={volverA} aria-label="Atrás">
          {boton}
        </Link>
      )}
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-borde">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${(paso / total) * 100}%` }}
        />
      </div>
      <span className="font-body text-xs font-bold text-tenue">
        {paso} / {total}
      </span>
    </div>
  )
}
