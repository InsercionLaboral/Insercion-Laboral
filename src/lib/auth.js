import { supabase } from './supabase.js'

/**
 * Traduce mensajes de error frecuentes de Supabase Auth al español.
 */
function traducirError(mensaje) {
  if (!mensaje) return 'Ocurrió un error. Intenta de nuevo.'
  const m = mensaje.toLowerCase()
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed'))
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Hiciste muchos intentos seguidos. Espera unos minutos e inténtalo de nuevo.'
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Ya existe una cuenta con este correo.'
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 8 caracteres.'
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'El correo no es válido.'
  if (m.includes('email not confirmed'))
    return 'Debes confirmar tu correo antes de iniciar sesión.'
  if (m.includes('acudiente'))
    return 'Un joven menor de edad requiere la autorización del acudiente.'
  return mensaje
}

/**
 * Registra un usuario. `metadata` se guarda en raw_user_meta_data y el trigger
 * handle_new_user() crea las filas en usuarios (y empresas) a partir de ella.
 *
 * Devuelve { session, necesitaConfirmacion }.
 * - session != null  → confirmación de correo desactivada; ya hay sesión.
 * - necesitaConfirmacion → hay que confirmar el correo antes de iniciar sesión.
 */
export async function registrarUsuario({ email, password, metadata }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
  if (error) throw new Error(traducirError(error.message))
  return {
    session: data.session,
    necesitaConfirmacion: !data.session,
  }
}

export async function iniciarSesion({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(traducirError(error.message))
  return data
}

export async function cerrarSesion() {
  await supabase.auth.signOut()
}

/** Marca el onboarding como completado para el usuario autenticado. */
export async function completarOnboarding(usuarioId) {
  const { error } = await supabase
    .from('usuarios')
    .update({ onboarding_completo: true })
    .eq('id', usuarioId)
  if (error) throw new Error(traducirError(error.message))
}
