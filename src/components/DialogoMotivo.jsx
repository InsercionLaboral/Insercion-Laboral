import { useEffect, useRef, useState } from 'react'

/**
 * Ventana para escribir el motivo al rechazar un perfil o un pop-up. La persona
 * afectada lo verá en su pantalla y en sus avisos, así sabe qué corregir.
 */
export function DialogoMotivo({ abierto, titulo, ayuda, onConfirmar, onCancelar, ocupado = false }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const campo = useRef(null)

  useEffect(() => {
    if (abierto) {
      setMotivo('')
      setError(null)
      setTimeout(() => campo.current?.focus(), 50)
    }
  }, [abierto])

  if (!abierto) return null

  function confirmar() {
    if (motivo.trim().length < 5) return setError('Escribe en pocas palabras qué debe corregir.')
    onConfirmar(motivo.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-motivo"
    >
      <div className="w-full max-w-md rounded-3xl bg-superficie p-5 shadow-2xl">
        <h2 id="titulo-motivo" className="font-display text-lg font-bold text-tinta">
          {titulo}
        </h2>
        <p className="mt-1 font-body text-[13px] text-tenue">{ayuda}</p>
        <textarea
          ref={campo}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Ej.: Agrega una foto donde se vea tu cara y cuenta un poco más sobre tu experiencia."
          aria-label="Motivo"
          className="mt-3 w-full rounded-2xl border border-borde bg-white px-3.5 py-3 font-body text-[14px] text-tinta outline-none"
        />
        {error && <p className="mt-1 font-body text-xs font-semibold text-joven">{error}</p>}
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="flex-1 rounded-xl border border-borde bg-white py-2.5 font-body text-[13.5px] font-bold text-tinta disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={ocupado}
            className="flex-[1.4] rounded-xl bg-[#C23B3B] py-2.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-50"
          >
            Rechazar y avisar
          </button>
        </div>
      </div>
    </div>
  )
}
