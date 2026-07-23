const VARIANTES = {
  joven: 'bg-joven text-white shadow-lg shadow-joven/50',
  empresario: 'bg-empresario text-white shadow-lg shadow-empresario/40',
  tinta: 'bg-tinta text-white shadow-lg shadow-tinta/40',
  contorno: 'bg-superficie text-tinta border border-borde',
}

/** Botón principal, estilo del mockup (Fredoka, redondeado, con sombra). */
export function Boton({
  children,
  variante = 'joven',
  type = 'button',
  disabled = false,
  cargando = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-display text-[17px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {cargando && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  )
}
