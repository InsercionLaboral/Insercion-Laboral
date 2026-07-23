/**
 * Construye un enlace wa.me ("clic para chatear", sin API de pago) a partir de
 * un teléfono. Asume Colombia (+57) si no trae indicativo. Devuelve null si no
 * hay un número válido.
 */
export function construirEnlaceWa(telefono, mensaje = '') {
  if (!telefono) return null
  let digitos = telefono.replace(/\D/g, '')
  if (digitos.length < 7) return null
  // Si son 10 dígitos (celular colombiano sin indicativo), anteponer 57.
  if (digitos.length === 10) digitos = '57' + digitos
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  return `https://wa.me/${digitos}${texto}`
}
