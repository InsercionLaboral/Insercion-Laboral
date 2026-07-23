import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute.jsx'
import { SoloInvitados } from '../auth/SoloInvitados.jsx'
import { RedirigirPorRol } from '../auth/RedirigirPorRol.jsx'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { ROLES } from '../constants/roles.js'
import { Landing } from '../pages/Landing.jsx'
import { Registro } from '../pages/Registro.jsx'
import { Login } from '../pages/Login.jsx'
import { ConfirmarCorreo } from '../pages/ConfirmarCorreo.jsx'
import { Onboarding } from '../pages/Onboarding.jsx'
import { Placeholder } from '../pages/Placeholder.jsx'
import { JovenHome } from '../pages/joven/JovenHome.jsx'
import { PerfilEditar } from '../pages/joven/PerfilEditar.jsx'
import { Portafolio } from '../pages/joven/Portafolio.jsx'
import { Directorio } from '../pages/empresario/Directorio.jsx'
import { PerfilTalento } from '../pages/empresario/PerfilTalento.jsx'

/**
 * Rutas. Fase 1: acceso (landing, registro, login, confirmación), onboarding y
 * redirección por rol implementados. Las pantallas por rol siguen siendo
 * placeholders hasta sus fases (ver fases-implementacion-insercion-laboral.md).
 */
export const router = createBrowserRouter([
  // Público (solo invitados)
  {
    path: '/',
    element: (
      <SoloInvitados>
        <Landing />
      </SoloInvitados>
    ),
  },
  {
    path: '/registro',
    element: (
      <SoloInvitados>
        <Registro />
      </SoloInvitados>
    ),
  },
  {
    path: '/login',
    element: (
      <SoloInvitados>
        <Login />
      </SoloInvitados>
    ),
  },
  { path: '/confirmar-correo', element: <ConfirmarCorreo /> },
  { path: '/terminos', element: <Placeholder titulo="Términos de uso" fase="Fase 7" /> },
  { path: '/privacidad', element: <Placeholder titulo="Política de privacidad" fase="Fase 7" /> },

  // Punto de entrada tras autenticarse
  { path: '/entrar', element: <RedirigirPorRol /> },
  {
    path: '/completar-registro',
    element: <Placeholder titulo="Completa tu registro" fase="Fase 1" />,
  },

  // Onboarding (requiere sesión, pero no exige onboarding previo)
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute requiereOnboarding={false}>
        <Onboarding />
      </ProtectedRoute>
    ),
  },

  // Área joven
  {
    path: '/joven',
    element: (
      <ProtectedRoute roles={[ROLES.JOVEN]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <JovenHome /> },
      { path: 'perfil', element: <PerfilEditar /> },
      { path: 'portafolio', element: <Portafolio /> },
    ],
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
      { index: true, element: <Directorio /> },
      { path: 'talento/:usuarioId', element: <PerfilTalento /> },
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
