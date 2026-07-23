import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute.jsx'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { ROLES } from '../constants/roles.js'
import { Landing } from '../pages/Landing.jsx'
import { Placeholder } from '../pages/Placeholder.jsx'

/**
 * Esqueleto de rutas de la Fase 0. Las páginas por rol son marcadores de
 * posición; se implementan en las fases 1–6 (ver
 * fases-implementacion-insercion-laboral.md).
 */
export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    path: '/login',
    element: <Placeholder titulo="Iniciar sesión" fase="Fase 1" />,
  },
  {
    path: '/registro',
    element: <Placeholder titulo="Crear cuenta" fase="Fase 1" />,
  },
  {
    path: '/completar-registro',
    element: <Placeholder titulo="Completar registro" fase="Fase 1" />,
  },

  // Área joven
  {
    path: '/joven',
    element: (
      <ProtectedRoute roles={[ROLES.JOVEN]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <Placeholder titulo="Inicio · Joven" fase="Fase 2" /> }],
  },

  // Área empresario
  {
    path: '/empresario',
    element: (
      <ProtectedRoute roles={[ROLES.EMPRESARIO]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Placeholder titulo="Inicio · Empresario" fase="Fase 2" /> },
    ],
  },

  // Área líder de área
  {
    path: '/lider',
    element: (
      <ProtectedRoute roles={[ROLES.LIDER, ROLES.ADMIN]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Placeholder titulo="Panel de aprobación · Líder" fase="Fase 4" /> },
    ],
  },

  // Área admin
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={[ROLES.ADMIN]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Placeholder titulo="Dashboard KPI · Admin" fase="Fase 6" /> },
    ],
  },

  { path: '*', element: <Placeholder titulo="Página no encontrada" fase="404" /> },
])
