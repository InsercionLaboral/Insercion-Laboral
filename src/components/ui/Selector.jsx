/**
 * Select nativo estilizado (mejor para móvil de gama media que un dropdown JS).
 * `opciones` es un array de { value, label }.
 */
export function Selector({
  etiqueta,
  icono,
  error,
  id,
  opciones = [],
  placeholder = 'Selecciona…',
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
        <select
          id={id}
          className="min-w-0 flex-1 appearance-none bg-transparent py-3.5 font-body text-[15px] text-tinta outline-none"
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-tenue">▾</span>
      </div>
      {error && <p className="mt-1 font-body text-xs font-semibold text-joven">{error}</p>}
    </div>
  )
}
