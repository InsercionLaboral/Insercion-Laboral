import { Link, useLocation } from 'react-router-dom'
import { AuthShell } from '../layouts/AuthShell.jsx'

/**
 * Se muestra cuando Supabase tiene activada la confirmación de correo: tras el
 * registro no hay sesión hasta confirmar. (En desarrollo puede desactivarse en
 * Supabase → Authentication → Providers → Email.)
 */
export function ConfirmarCorreo() {
  const { state } = useLocation()
  const email = state?.email

  return (
    <AuthShell acento="joven">
      <div className="flex flex-1 flex-col justify-center py-10 text-center">
        <div className="mx-auto w-full max-w-sm">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-lima/40 text-4xl">
            ✉️
          </div>
          <h1 className="font-display text-2xl font-bold text-tinta">Revisa tu correo</h1>
          <p className="mt-2 font-body text-[14.5px] text-tenue">
            Te enviamos un enlace de confirmación
            {email ? (
              <>
                {' '}a <span className="font-bold text-tinta">{email}</span>
              </>
            ) : null}
            . Ábrelo para activar tu cuenta y luego inicia sesión.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-2xl bg-tinta px-6 py-3 font-display font-semibold text-white"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
