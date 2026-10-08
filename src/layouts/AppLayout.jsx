import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { ROLES } from '../constants/roles.js'
import { useAvisosNoLeidos } from '../hooks/useAvisosNoLeidos.js'

const NAV_POR_ROL = {
  [ROLES.JOVEN]: [
    { to: '/joven', fin: true, icono: '🏠', texto: 'Inicio' },
    { to: '/joven/popups', icono: '⚡', texto: 'Pop-ups' },
    { to: '/joven/recursos', icono: '📚', texto: 'Recursos' },
    { to: '/joven/perfil', icono: '📝', texto: 'Mi perfil' },
    { to: '/joven/portafolio', icono: '👀', texto: 'Portafolio' },
  ],
  [ROLES.EMPRESARIO]: [
    { to: '/empresario', fin: true, icono: '🔎', texto: 'Directorio' },
    { to: '/empresario/popups', icono: '⚡', texto: 'Mis pop-ups' },
    { to: '/empresario/contratados', icono: '🤝', texto: 'Contratados' },
  ],
  [ROLES.LIDER]: [
    { to: '/lider', fin: true, icono: '✅', texto: 'Aprobaciones' },
    { to: '/lider/seguimiento', icono: '🤝', texto: 'Seguimiento' },
    { to: '/lider/recursos', icono: '📚', texto: 'Recursos' },
    { to: '/lider/auditoria', icono: '🗂️', texto: 'Historial' },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin', fin: true, icono: '📊', texto: 'Indicadores' },
    { to: '/lider', fin: true, icono: '✅', texto: 'Aprobaciones' },
    { to: '/lider/seguimiento', icono: '🤝', texto: 'Seguimiento' },
    { to: '/lider/recursos', icono: '📚', texto: 'Recursos' },
    { to: '/admin/usuarios', icono: '👥', texto: 'Usuarios' },
  ],
}

// El personal del Comité trabaja a menudo desde computador: ancho mayor.
const ANCHO_POR_ROL = {
  [ROLES.LIDER]: 'max-w-3xl',
  [ROLES.ADMIN]: 'max-w-5xl',
}

export function AppLayout() {
  const { usuario, rol, signOut } = useAuth()
  const nav = NAV_POR_ROL[rol] ?? []
  const ancho = ANCHO_POR_ROL[rol] ?? 'max-w-screen-sm'
  const sinLeer = useAvisosNoLeidos()

  return (
    <div className={`mx-auto flex min-h-dvh w-full ${ancho} flex-col bg-fondo`}>
      <header className="no-imprimir flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold text-tinta">Inserción Laboral</span>
        <div className="flex items-center gap-2">
          {sinLeer !== null && (
            <NavLink
              to="/avisos"
              className="relative flex size-9 items-center justify-center rounded-full border border-borde bg-superficie text-lg"
              aria-label={sinLeer > 0 ? `Avisos: ${sinLeer} sin leer` : 'Avisos'}
              title="Avisos"
            >
              🔔
              {sinLeer > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-joven px-1 font-body text-[10.5px] font-bold leading-5 text-white">
                  {sinLeer > 9 ? '9+' : sinLeer}
                </span>
              )}
            </NavLink>
          )}
          <NavLink
            to="/cuenta"
            className="flex h-9 items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 font-body text-xs font-bold text-tinta"
            title="Mi cuenta"
          >
            👤 <span className="hidden sm:inline">{usuario?.nombre?.split(' ')[0] ?? 'Mi cuenta'}</span>
            <span className="sm:hidden">Cuenta</span>
          </NavLink>
          <button
            onClick={signOut}
            className="h-9 rounded-full border border-borde bg-superficie px-3 font-body text-xs font-bold text-tenue"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28">
        <Outlet />
        <p className="no-imprimir mt-10 text-center font-body text-[11.5px] text-tenue">
          <Link to="/terminos" className="font-bold">Términos de uso</Link> ·{' '}
          <Link to="/privacidad" className="font-bold">Privacidad</Link>
        </p>
      </main>

      {nav.length > 0 && (
        <nav
          className={`no-imprimir sticky bottom-0 mx-auto w-full ${ancho} border-t border-borde bg-superficie/95 px-2 py-2 backdrop-blur`}
        >
          <ul className="flex items-center justify-around gap-0.5">
            {nav.map((item) => (
              <li key={item.to + item.texto} className="min-w-0 flex-1">
                <NavLink
                  to={item.to}
                  end={item.fin}
                  className={({ isActive }) =>
                    `flex w-full flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 font-body text-[10.5px] font-bold sm:text-[11px] ${
                      isActive ? 'text-joven' : 'text-tenue'
                    }`
                  }
                >
                  <span className="text-xl">{item.icono}</span>
                  <span className="max-w-full truncate">{item.texto}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
