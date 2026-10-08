import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { AuthShell } from '../layouts/AuthShell.jsx'
import { Boton } from '../components/ui/Boton.jsx'

/**
 * Pantalla de rescate: hay sesión pero no se encontró el perfil de la cuenta
 * (por ejemplo, por una conexión que se cortó justo al registrarse). En vez de
 * dejar a la persona atrapada, permite reintentar o salir.
 */
export function CompletarRegistro() {
  const { session, usuario, listo, refrescarUsuario, signOut } = useAuth()
  const [reintentando, setReintentando] = useState(false)

  if (listo && !session) return <Navigate to="/login" replace />
  if (usuario) return <Navigate to="/entrar" replace />

  async function reintentar() {
    setReintentando(true)
    try {
      await refrescarUsuario()
    } finally {
      setReintentando(false)
    }
  }

  return (
    <AuthShell acento="empresario">
      <div className="flex flex-1 flex-col justify-center py-10 text-center">
        <div className="mx-auto w-full max-w-sm">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-naranja/20 text-4xl">
            🔄
          </div>
          <h1 className="font-display text-2xl font-bold text-tinta">Casi listo</h1>
          <p className="mt-2 font-body text-[14.5px] text-tenue">
            No pudimos cargar los datos de tu cuenta
            {session?.user?.email ? (
              <>
                {' '}(<span className="font-bold text-tinta">{session.user.email}</span>)
              </>
            ) : null}
            . Suele pasar por una conexión inestable. Inténtalo de nuevo; si sigue igual, cierra
            sesión y vuelve a entrar.
          </p>
          <Boton variante="empresario" className="mt-6" cargando={reintentando} onClick={reintentar}>
            Reintentar
          </Boton>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 font-body text-sm font-bold text-tenue"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
