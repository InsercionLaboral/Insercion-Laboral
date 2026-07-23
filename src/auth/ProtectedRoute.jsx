import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import { HOME_POR_ROL } from '../constants/roles.js'
import { Cargando } from '../components/Cargando.jsx'

/**
 * Envuelve rutas que requieren sesión. Si se pasan `roles`, además restringe
 * el acceso a esos roles y redirige al home del rol real si no coincide.
 *
 *   <ProtectedRoute roles={[ROLES.LIDER, ROLES.ADMIN]}> ... </ProtectedRoute>
 */
export function ProtectedRoute({ roles, children }) {
  const { session, usuario, rol, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Cargando />

  // Sin sesión → al login, recordando a dónde iba.
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Con sesión pero sin fila en `usuarios` todavía (registro incompleto).
  if (!usuario) {
    return <Navigate to="/completar-registro" replace />
  }

  // Restricción por rol.
  if (roles && !roles.includes(rol)) {
    return <Navigate to={HOME_POR_ROL[rol] ?? '/'} replace />
  }

  return children
}
