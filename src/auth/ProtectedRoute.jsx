import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import { HOME_POR_ROL } from '../constants/roles.js'
import { Cargando } from '../components/Cargando.jsx'

/**
 * Envuelve rutas que requieren sesión. Opciones:
 * - `roles`: restringe a esos roles (redirige al home del rol real si no coincide).
 * - `requiereOnboarding` (default true): si el usuario no completó el onboarding,
 *   lo manda a /onboarding. La propia ruta de onboarding lo pone en false.
 */
export function ProtectedRoute({ roles, requiereOnboarding = true, children }) {
  const { session, usuario, rol, listo } = useAuth()
  const location = useLocation()

  if (!listo) return <Cargando />

  // Sin sesión → al login, recordando a dónde iba.
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Con sesión pero sin fila en `usuarios` (registro incompleto o sin confirmar).
  if (!usuario) {
    return <Navigate to="/completar-registro" replace />
  }

  // Falta completar el onboarding inicial.
  if (requiereOnboarding && !usuario.onboarding_completo) {
    return <Navigate to="/onboarding" replace />
  }

  // Restricción por rol.
  if (roles && !roles.includes(rol)) {
    return <Navigate to={HOME_POR_ROL[rol] ?? '/'} replace />
  }

  return children
}
