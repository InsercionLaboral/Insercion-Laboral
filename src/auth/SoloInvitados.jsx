import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider.jsx'
import { Cargando } from '../components/Cargando.jsx'

/**
 * Rutas públicas de acceso (landing, login, registro): si ya hay sesión,
 * redirige al flujo interno para no mostrar el login a alguien autenticado.
 */
export function SoloInvitados({ children }) {
  const { session, listo } = useAuth()
  if (!listo) return <Cargando />
  if (session) return <Navigate to="/entrar" replace />
  return children
}
