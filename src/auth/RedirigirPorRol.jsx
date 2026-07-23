import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import { HOME_POR_ROL } from '../constants/roles.js'
import { Cargando } from '../components/Cargando.jsx'

/**
 * Punto de entrada tras iniciar sesión / registrarse: espera a que se resuelva
 * la sesión y el usuario, y redirige al destino correcto según rol y onboarding.
 */
export function RedirigirPorRol() {
  const { session, usuario, listo } = useAuth()

  if (!listo) return <Cargando />
  if (!session) return <Navigate to="/login" replace />
  if (!usuario) return <Navigate to="/completar-registro" replace />
  if (!usuario.onboarding_completo) return <Navigate to="/onboarding" replace />
  return <Navigate to={HOME_POR_ROL[usuario.rol] ?? '/'} replace />
}
