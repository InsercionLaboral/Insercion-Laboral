const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-07-12" → "12 jul" */
export function fechaCorta(iso) {
  if (!iso) return null
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return null
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

/** Rango "12–17 jul" (o "12 jul – 3 ago" si cambian de mes). */
export function rangoFechas(inicio, fin) {
  const a = fechaCorta(inicio)
  const b = fechaCorta(fin)
  if (!a && !b) return null
  if (!b) return a
  if (!a) return b
  const [dA, mA] = a.split(' ')
  const [dB, mB] = b.split(' ')
  return mA === mB ? `${dA}–${dB} ${mB}` : `${a} – ${b}`
}

/** Días completos entre dos fechas (inclusive). */
export function duracionDias(inicio, fin) {
  if (!inicio || !fin) return null
  const a = new Date(inicio + 'T00:00:00')
  const b = new Date(fin + 'T00:00:00')
  const dias = Math.round((b - a) / 86400000) + 1
  return dias > 0 ? dias : null
}

/** Días restantes hasta una fecha de cierre; null si no aplica. */
export function diasRestantes(iso) {
  if (!iso) return null
  const cierre = new Date(iso)
  if (Number.isNaN(cierre.getTime())) return null
  const dias = Math.ceil((cierre - new Date()) / 86400000)
  return dias
}
