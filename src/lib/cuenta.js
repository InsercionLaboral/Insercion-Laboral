import { supabase } from './supabase.js'

/** Traduce los errores más comunes al cambiar o recuperar la contraseña. */
function mensaje(error) {
  const m = (error?.message ?? '').toLowerCase()
  if (m.includes('should be different')) return 'La contraseña nueva debe ser distinta de la anterior.'
  if (m.includes('at least')) return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Hiciste muchos intentos. Espera unos minutos.'
  if (m.includes('failed to fetch')) return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.'
  if (m.includes('email address') && (m.includes('invalid') || m.includes('not authorized')))
    return 'No pudimos enviar el correo a esa dirección.'
  if (m.includes('error sending')) return 'No pudimos enviar el correo en este momento.'
  return error?.message ?? 'Ocurrió un error. Intenta de nuevo.'
}

/** Datos básicos de la persona: nombre y municipio. */
export async function actualizarMisDatos(usuarioId, { nombre, municipioId }) {
  const limpio = nombre?.trim()
  if (!limpio) throw new Error('Escribe tu nombre.')
  const { error } = await supabase
    .from('usuarios')
    .update({ nombre: limpio, municipio_id: municipioId || null })
    .eq('id', usuarioId)
  if (error) throw new Error(error.message)
}

/** Datos de la empresa del empresario. */
export async function actualizarMiEmpresa(empresaId, { nombreEmpresa, nit, sector, municipioId }) {
  const limpio = nombreEmpresa?.trim()
  if (!limpio) throw new Error('Escribe el nombre de la empresa.')
  const { error } = await supabase
    .from('empresas')
    .update({
      nombre_empresa: limpio,
      nit: nit?.trim() || null,
      sector: sector?.trim() || null,
      municipio_id: municipioId || null,
    })
    .eq('id', empresaId)
  if (error) throw new Error(error.message)
}

/** Cambia la contraseña de la sesión actual (también se usa tras el enlace de recuperación). */
export async function cambiarContrasena(nueva) {
  if (!nueva || nueva.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw new Error(mensaje(error))
}

/** Envía el correo para recuperar la contraseña. */
export async function enviarCorreoRecuperacion(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/restablecer`,
  })
  if (error) throw new Error(mensaje(error))
}

/** El administrador pone una contraseña nueva a una cuenta. */
export async function restablecerContrasenaDe(usuarioId, nueva) {
  const { error } = await supabase.rpc('admin_restablecer_contrasena', {
    p_usuario_id: usuarioId,
    p_contrasena: nueva,
  })
  if (error) throw new Error(mensaje(error))
}
