/** Indicador de carga a pantalla completa, mobile-first. */
export function Cargando({ mensaje = 'Cargando…' }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-fondo">
      <span
        className="size-10 animate-spin rounded-full border-4 border-borde border-t-joven"
        role="status"
        aria-label="Cargando"
      />
      <p className="font-body text-sm text-tenue">{mensaje}</p>
    </div>
  )
}
