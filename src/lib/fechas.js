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

/** Fecha de hoy en hora local, formato YYYY-MM-DD (para columnas `date`). */
export function hoyLocal() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Días transcurridos entre dos fechas YYYY-MM-DD (b por defecto: hoy). */
export function diasEntre(a, b = hoyLocal()) {
  if (!a) return null
  const da = new Date(a.slice(0, 10) + 'T00:00:00')
  const db = new Date(b.slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null
  return Math.max(0, Math.round((db - da) / 86400000))
}

/** Tiempo en palabras sencillas: "5 días", "6 semanas", "3 meses". */
export function textoPermanencia(dias) {
  if (dias == null) return '—'
  if (dias < 1) return 'Hoy'
  if (dias === 1) return '1 día'
  if (dias < 14) return `${dias} días`
  if (dias < 60) return `${Math.round(dias / 7)} semanas`
  if (dias < 365) return `${Math.round(dias / 30)} meses`
  const anios = dias / 365
  return `${anios.toFixed(1).replace('.0', '').replace('.', ',')} años`
}

/** Fecha larga legible: "12 de julio de 2026". */
export function fechaLarga(iso) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}
