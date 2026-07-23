import { Link } from 'react-router-dom'

/**
 * Marcador de posición para pantallas que se construyen en fases posteriores.
 * Deja claro qué pantalla falta y en qué fase se implementa.
 */
export function Placeholder({ titulo, fase }) {
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <span className="rounded-full bg-lima/40 px-3 py-1 font-body text-xs font-bold text-tinta">
        {fase}
      </span>
      <h1 className="font-display text-2xl font-bold text-tinta">{titulo}</h1>
      <p className="font-body text-sm text-tenue">
        Esta pantalla se implementa en una fase posterior. Ver{' '}
        <span className="font-semibold">
          fases-implementacion-insercion-laboral.md
        </span>
        .
      </p>
      <Link to="/" className="mt-2 font-body text-sm font-bold text-empresario">
        ← Volver al inicio
      </Link>
    </div>
  )
}
