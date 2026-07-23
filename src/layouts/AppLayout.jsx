import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'

/**
 * Shell mobile-first para las áreas autenticadas. En fases posteriores
 * albergará la navegación por rol (barra inferior en móvil, sidebar en desktop).
 */
export function AppLayout() {
  const { usuario, signOut } = useAuth()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col bg-fondo">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold text-tinta">
          Inserción Laboral
        </span>
        {usuario && (
          <button
            onClick={signOut}
            className="rounded-full border border-borde bg-superficie px-3 py-1.5 font-body text-xs font-bold text-tenue"
          >
            Salir
          </button>
        )}
      </header>
      <main className="flex-1 px-5 pb-8">
        <Outlet />
      </main>
    </div>
  )
}
