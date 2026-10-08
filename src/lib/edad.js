// Utilidades de edad para el registro (Habeas Data / menores de edad).

export const EDAD_MINIMA = 16
// Tope de edad del programa. Ampliado de 28 a 35 por observación de las pruebas
// con usuarios; si cambia de nuevo, basta con editar esta constante.
export const EDAD_MAXIMA = 35

/** Edad cumplida a partir de una fecha de nacimiento (YYYY-MM-DD). */
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const nac = new Date(fechaNacimiento)
  if (Number.isNaN(nac.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

/** true si la edad corresponde a un menor de edad (16-17). */
export function esMenorDeEdad(edad) {
  return edad !== null && edad >= EDAD_MINIMA && edad < 18
}

/**
 * Valida el rango de edad permitido para jóvenes (EDAD_MINIMA–EDAD_MAXIMA).
 * Devuelve un mensaje de error o null si es válida.
 */
export function validarEdadJoven(fechaNacimiento) {
  const edad = calcularEdad(fechaNacimiento)
  if (edad === null) return 'Ingresa tu fecha de nacimiento.'
  if (edad < EDAD_MINIMA) return `Debes tener al menos ${EDAD_MINIMA} años para registrarte.`
  if (edad > EDAD_MAXIMA) return `El programa es para jóvenes de hasta ${EDAD_MAXIMA} años.`
  return null
}
