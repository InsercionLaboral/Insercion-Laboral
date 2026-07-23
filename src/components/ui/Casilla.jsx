/**
 * Casilla de verificación con etiqueta rica (para las autorizaciones de
 * Habeas Data). El color del check se adapta al acento (`joven`/`empresario`).
 */
export function Casilla({ checked, onChange, children, acento = 'joven', id, error }) {
  const colorMarcado = acento === 'empresario' ? 'bg-empresario' : 'bg-joven'
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border text-[15px] text-white transition ${
            checked ? `${colorMarcado} border-transparent` : 'border-borde bg-white'
          }`}
        >
          {checked ? '✓' : ''}
        </span>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className="font-body text-[13px] leading-snug text-tenue">{children}</span>
      </label>
      {error && <p className="ml-9 mt-1 font-body text-xs font-semibold text-joven">{error}</p>}
    </div>
  )
}
