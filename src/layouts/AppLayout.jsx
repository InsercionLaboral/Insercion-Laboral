import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { ROLES } from '../constants/roles.js'

const NAV_POR_ROL = {
  [ROLES.JOVEN]: [
    { to: '/joven', fin: true, icono: '🏠', texto: 'Inicio' },
    { to: '/joven/perfil', icono: '📝', texto: 'Mi perfil' },
    { to: '/joven/portafolio', icono: '👀', texto: 'Portafolio' },
  ],
  [ROLES.EMPRESARIO]: [
    { to: '/empresario', fin: true, icono: '🔎', texto: 'Directorio' },
  ],
  [ROLES.LIDER]: [{ to: '/lider', fin: true, icono: '✅', texto: 'Aprobaciones' }],
  [ROLES.ADMIN]: [{ to: '/admin', fin: true, icono: '📊', texto: 'Dashboard' }],
}

export function AppLayout() {
  const { usuario, rol, signOut } = useAuth()
  const nav = NAV_POR_ROL[rol] ?? []

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col bg-fondo">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold text-tinta">Inserción Laboral</span>
        <div className="flex items-center gap-3">
          {usuario?.nombre && (
            <span className="hidden font-body text-sm text-tenue sm:block">
              Hola, {usuario.nombre.split(' ')[0]}
            </span>
          )}
          <button
            onClick={signOut}
            className="rounded-full border border-borde bg-superficie px-3 py-1.5 font-body text-xs font-bold text-tenue"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28">
        <Outlet />
      </main>

      {nav.length > 0 && (
        <nav className="sticky bottom-0 mx-auto w-full max-w-screen-sm border-t border-borde bg-superficie/95 px-4 py-2 backdrop-blur">
          <ul className="flex items-center justify-around">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.fin}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 font-body text-[11px] font-bold ${
                      isActive ? 'text-joven' : 'text-tenue'
                    }`
                  }
                >
                  <span className="text-xl">{item.icono}</span>
                  {item.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
