import { Link } from 'react-router-dom'

/** Pantalla 404. */
export function NoEncontrada() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-lima/40 text-4xl">🧭</div>
      <h1 className="font-display text-2xl font-bold text-tinta">No encontramos esta página</h1>
      <p className="mt-2 font-body text-sm text-tenue">
        Puede que el enlace esté mal escrito o que la página ya no exista.
      </p>
      <Link
        to="/entrar"
        className="mt-6 rounded-2xl bg-tinta px-6 py-3 font-display font-semibold text-white"
      >
        Ir al inicio
      </Link>
    </div>
  )
}
