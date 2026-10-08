import { Avatar } from './ui/Avatar.jsx'
import { diasPermanencia, requiereSeguimiento } from '../lib/contrataciones.js'
import { fechaLarga, textoPermanencia } from '../lib/fechas.js'

/**
 * Tarjeta de una contratación. Si recibe `onSeguimiento`, muestra las acciones
 * para confirmar que la persona sigue vinculada o que terminó la vinculación.
 */
export function TarjetaContratacion({ c, onSeguimiento, onReactivar, ocupado = false }) {
  const permanencia = textoPermanencia(diasPermanencia(c))
  const alerta = requiereSeguimiento(c)

  return (
    <div className="rounded-2xl border border-borde bg-white p-4">
      <div className="flex items-center gap-3">
        <Avatar nombre={c.joven} fotoUrl={c.fotoUrl} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold text-tinta">{c.joven}</p>
          <p className="truncate font-body text-xs text-tenue">
            {c.popup}
            {c.empresa ? ` · ${c.empresa}` : ''}
          </p>
          {c.municipio && <p className="font-body text-xs text-tenue">📍 {c.municipio}</p>}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[11.5px] font-bold ${
            c.activo ? 'bg-[#2FB863]/15 text-[#1c7d42]' : 'bg-borde text-tenue'
          }`}
        >
          {c.activo ? 'Vinculado' : 'Finalizado'}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center font-body">
        <div className="rounded-xl bg-fondo px-2 py-2">
          <dt className="text-[10.5px] font-bold uppercase tracking-wide text-tenue">Inicio</dt>
          <dd className="mt-0.5 text-[12.5px] font-bold text-tinta">{fechaLarga(c.fechaInicio)}</dd>
        </div>
        <div className="rounded-xl bg-fondo px-2 py-2">
          <dt className="text-[10.5px] font-bold uppercase tracking-wide text-tenue">Tiempo</dt>
          <dd className="mt-0.5 text-[12.5px] font-bold text-tinta">{permanencia}</dd>
        </div>
        <div className="rounded-xl bg-fondo px-2 py-2">
          <dt className="text-[10.5px] font-bold uppercase tracking-wide text-tenue">Último contacto</dt>
          <dd className="mt-0.5 text-[12.5px] font-bold text-tinta">
            {c.ultimoSeguimiento ? fechaLarga(c.ultimoSeguimiento) : 'Sin registrar'}
          </dd>
        </div>
      </dl>

      {alerta && (
        <p className="mt-3 rounded-xl bg-naranja/10 px-3 py-2 font-body text-[12.5px] text-[#B96C00]">
          Hace más de un mes que no confirmas cómo va esta vinculación.
        </p>
      )}

      {onSeguimiento && c.activo && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onSeguimiento(c, true)}
            className="rounded-full bg-tinta px-3.5 py-2 font-body text-[12.5px] font-bold text-lima disabled:opacity-50"
          >
            ✓ Sigue vinculado
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onSeguimiento(c, false)}
            className="rounded-full border border-borde px-3.5 py-2 font-body text-[12.5px] font-bold text-tinta disabled:opacity-50"
          >
            Ya no está vinculado
          </button>
        </div>
      )}
      {onReactivar && !c.activo && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => onReactivar(c)}
          className="mt-3 rounded-full border border-borde px-3.5 py-2 font-body text-[12.5px] font-bold text-tinta disabled:opacity-50"
        >
          Volver a marcar como vinculado
        </button>
      )}
    </div>
  )
}
