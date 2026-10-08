// Utilidades de edad para el registro (Habeas Data / menores de edad).

export const EDAD_MINIMA = 16
// Sin tope de edad máximo: el programa admite jóvenes desde los 16 años.

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
 * Valida la edad mínima para registrarse (EDAD_MINIMA).
 * Devuelve un mensaje de error o null si es válida.
 */
export function validarEdadJoven(fechaNacimiento) {
  const edad = calcularEdad(fechaNacimiento)
  if (edad === null) return 'Ingresa tu fecha de nacimiento.'
  if (edad < EDAD_MINIMA) return `Debes tener al menos ${EDAD_MINIMA} años para registrarte.`
  if (edad > 120) return 'Revisa la fecha de nacimiento.'
  return null
}
