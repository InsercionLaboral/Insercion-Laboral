/**
 * Campo de formulario con etiqueta, icono opcional, texto de ayuda y error.
 * Envuelve un <input> nativo con el estilo del mockup.
 */
export function Campo({
  etiqueta,
  icono,
  ayuda,
  error,
  sufijo,
  id,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {etiqueta && (
        <label htmlFor={id} className="mb-1.5 block font-body text-[13.5px] font-bold text-tinta">
          {etiqueta}
        </label>
      )}
      <div
        className={`flex items-center gap-2.5 rounded-2xl border bg-white px-3.5 ${
          error ? 'border-joven' : 'border-borde'
        }`}
      >
        {icono && <span className="text-[17px]">{icono}</span>}
        <input
          id={id}
          className="min-w-0 flex-1 bg-transparent py-3.5 font-body text-[15px] text-tinta outline-none"
          {...props}
        />
        {sufijo}
      </div>
      {error ? (
        <p className="mt-1 font-body text-xs font-semibold text-joven">{error}</p>
      ) : ayuda ? (
        <p className="mt-1 font-body text-xs text-tenue">{ayuda}</p>
      ) : null}
    </div>
  )
}
