const ESTADOS = {
  // Pop-ups
  pendiente: { texto: 'En revisión', clase: 'bg-naranja/20 text-[#B96C00]' },
  aprobado: { texto: '✓ Publicado', clase: 'bg-tinta text-lima' },
  rechazado: { texto: 'Rechazado', clase: 'bg-joven/15 text-joven' },
  cerrado: { texto: 'Cerrado', clase: 'bg-borde text-tenue' },
  // Perfiles
  en_revision: { texto: 'En revisión', clase: 'bg-naranja/20 text-[#B96C00]' },
  borrador: { texto: 'Borrador', clase: 'bg-borde text-tenue' },
  // Postulaciones
  enviada: { texto: 'Enviada', clase: 'bg-empresario/12 text-[#0a7c84]' },
  vista: { texto: 'Vista', clase: 'bg-borde text-tenue' },
  preseleccionado: { texto: 'Preseleccionado', clase: 'bg-naranja/20 text-[#B96C00]' },
  contratado: { texto: '✓ Contratado', clase: 'bg-tinta text-lima' },
  descartado: { texto: 'Descartado', clase: 'bg-joven/15 text-joven' },
}

export function EstadoBadge({ estado, className = '' }) {
  const info = ESTADOS[estado] ?? { texto: estado, clase: 'bg-borde text-tenue' }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 font-body text-[11.5px] font-bold ${info.clase} ${className}`}
    >
      {info.texto}
    </span>
  )
}
