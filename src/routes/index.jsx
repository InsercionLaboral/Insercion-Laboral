import { Outlet, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute.jsx'
import { SoloInvitados } from '../auth/SoloInvitados.jsx'
import { RedirigirPorRol } from '../auth/RedirigirPorRol.jsx'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { Cargando } from '../components/Cargando.jsx'
import { ROLES } from '../constants/roles.js'

/**
 * Carga diferida por pantalla: el navegador solo descarga el código de la
 * pantalla que se visita (menos datos en móviles de gama media).
 */
const perezoso = (importador, nombre) => ({
  lazy: async () => ({ Component: (await importador())[nombre] }),
})

const soloInvitados = (
  <SoloInvitados>
    <Outlet />
  </SoloInvitados>
)

const protegido = (roles, props = {}) => (
  <ProtectedRoute roles={roles} {...props}>
    <AppLayout />
  </ProtectedRoute>
)

export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <Cargando />,
    children: [
      // Público (solo invitados)
      {
        element: soloInvitados,
        children: [
          { path: '/', ...perezoso(() => import('../pages/Landing.jsx'), 'Landing') },
          { path: '/registro', ...perezoso(() => import('../pages/Registro.jsx'), 'Registro') },
          { path: '/login', ...perezoso(() => import('../pages/Login.jsx'), 'Login') },
          {
            path: '/recuperar',
            ...perezoso(() => import('../pages/RecuperarContrasena.jsx'), 'RecuperarContrasena'),
          },
        ],
      },
      {
        path: '/confirmar-correo',
        ...perezoso(() => import('../pages/ConfirmarCorreo.jsx'), 'ConfirmarCorreo'),
      },
      { path: '/terminos', ...perezoso(() => import('../pages/Legal.jsx'), 'Terminos') },
      { path: '/privacidad', ...perezoso(() => import('../pages/Legal.jsx'), 'Privacidad') },

      // Destino del enlace de recuperación (abre una sesión temporal)
      {
        path: '/restablecer',
        ...perezoso(() => import('../pages/RestablecerContrasena.jsx'), 'RestablecerContrasena'),
      },

      // Comunes a todos los roles
      {
        element: protegido(undefined),
        children: [
          { path: '/avisos', ...perezoso(() => import('../pages/Avisos.jsx'), 'Avisos') },
          { path: '/cuenta', ...perezoso(() => import('../pages/MiCuenta.jsx'), 'MiCuenta') },
        ],
      },

      // Punto de entrada tras autenticarse
      { path: '/entrar', element: <RedirigirPorRol /> },
      {
        path: '/completar-registro',
        ...perezoso(() => import('../pages/CompletarRegistro.jsx'), 'CompletarRegistro'),
      },

      // Onboarding (requiere sesión, pero no exige onboarding previo)
      {
        path: '/onboarding',
        element: (
          <ProtectedRoute requiereOnboarding={false}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [{ index: true, ...perezoso(() => import('../pages/Onboarding.jsx'), 'Onboarding') }],
      },

      // Área joven
      {
        path: '/joven',
        element: protegido([ROLES.JOVEN]),
        children: [
          { index: true, ...perezoso(() => import('../pages/joven/JovenHome.jsx'), 'JovenHome') },
          { path: 'perfil', ...perezoso(() => import('../pages/joven/PerfilEditar.jsx'), 'PerfilEditar') },
          { path: 'portafolio', ...perezoso(() => import('../pages/joven/Portafolio.jsx'), 'Portafolio') },
          { path: 'popups', ...perezoso(() => import('../pages/joven/PopupsJoven.jsx'), 'PopupsJoven') },
          {
            path: 'popups/:popupId',
            ...perezoso(() => import('../pages/joven/PopupDetalleJoven.jsx'), 'PopupDetalleJoven'),
          },
          { path: 'recursos', ...perezoso(() => import('../pages/joven/Recursos.jsx'), 'Recursos') },
        ],
      },

      // Área empresario
      {
        path: '/empresario',
        element: protegido([ROLES.EMPRESARIO]),
        children: [
          { index: true, ...perezoso(() => import('../pages/empresario/Directorio.jsx'), 'Directorio') },
          {
            path: 'talento/:usuarioId',
            ...perezoso(() => import('../pages/empresario/PerfilTalento.jsx'), 'PerfilTalento'),
          },
          { path: 'popups', ...perezoso(() => import('../pages/empresario/MisPopups.jsx'), 'MisPopups') },
          { path: 'popups/nuevo', ...perezoso(() => import('../pages/empresario/NuevoPopup.jsx'), 'NuevoPopup') },
          {
            path: 'popups/:popupId/editar',
            ...perezoso(() => import('../pages/empresario/NuevoPopup.jsx'), 'NuevoPopup'),
          },
          {
            path: 'popups/:popupId',
            ...perezoso(() => import('../pages/empresario/PopupDetalle.jsx'), 'PopupDetalle'),
          },
          { path: 'contratados', ...perezoso(() => import('../pages/empresario/Contratados.jsx'), 'Contratados') },
        ],
      },

      // Área líder de área (también accesible para el admin)
      {
        path: '/lider',
        element: protegido([ROLES.LIDER, ROLES.ADMIN]),
        children: [
          { index: true, ...perezoso(() => import('../pages/lider/Aprobaciones.jsx'), 'Aprobaciones') },
          {
            path: 'perfil/:usuarioId',
            ...perezoso(() => import('../pages/lider/RevisarPerfil.jsx'), 'RevisarPerfil'),
          },
          { path: 'popup/:popupId', ...perezoso(() => import('../pages/lider/RevisarPopup.jsx'), 'RevisarPopup') },
          { path: 'seguimiento', ...perezoso(() => import('../pages/lider/Seguimiento.jsx'), 'Seguimiento') },
          { path: 'recursos', ...perezoso(() => import('../pages/lider/Recursos.jsx'), 'RecursosGestion') },
          { path: 'auditoria', ...perezoso(() => import('../pages/lider/Auditoria.jsx'), 'Auditoria') },
        ],
      },

      // Área admin
      {
        path: '/admin',
        element: protegido([ROLES.ADMIN]),
        children: [
          { index: true, ...perezoso(() => import('../pages/admin/Dashboard.jsx'), 'Dashboard') },
          { path: 'usuarios', ...perezoso(() => import('../pages/admin/Usuarios.jsx'), 'Usuarios') },
        ],
      },

      { path: '*', ...perezoso(() => import('../pages/NoEncontrada.jsx'), 'NoEncontrada') },
    ],
  },
])
