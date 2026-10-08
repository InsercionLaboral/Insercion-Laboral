import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { AuthShell } from '../layouts/AuthShell.jsx'
import { Boton } from '../components/ui/Boton.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { Cargando } from '../components/Cargando.jsx'
import { cambiarContrasena } from '../lib/cuenta.js'

/**
 * Destino del enlace que llega por correo: el enlace abre una sesión temporal
 * y aquí la persona escribe su contraseña nueva.
 */
export function RestablecerContrasena() {
  const { session, listo } = useAuth()
  const navigate = useNavigate()
  const [clave, setClave] = useState('')
  const [repetir, setRepetir] = useState('')
  const [ver, setVer] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    setError(null)
    if (clave !== repetir) return setError('Las dos contraseñas no coinciden.')
    setGuardando(true)
    try {
      await cambiarContrasena(clave)
      navigate('/entrar', { replace: true })
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  if (!listo) return <Cargando />

  return (
    <AuthShell acento="empresario">
      <form onSubmit={guardar} className="flex flex-1 flex-col justify-center py-6">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-[28px] font-bold leading-tight text-tinta">Crea tu contraseña nueva</h1>
          {!session ? (
            <>
              <p className="mt-3 font-body text-[14.5px] text-tenue">
                Este enlace ya no sirve o expiró. Pide uno nuevo desde “¿Olvidaste tu contraseña?”.
              </p>
              <Link to="/recuperar" className="mt-5 inline-block font-body text-sm font-bold text-empresario">
                Pedir un enlace nuevo
              </Link>
            </>
          ) : (
            <>
              <p className="mb-6 mt-1 font-body text-[14.5px] text-tenue">Escríbela dos veces para confirmarla.</p>
              <div className="space-y-4">
                <Campo
                  id="clave-nueva"
                  etiqueta="Contraseña nueva"
                  type={ver ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  ayuda="Mínimo 8 caracteres."
                  sufijo={
                    <button type="button" onClick={() => setVer((v) => !v)} className="font-body text-[13px] font-bold text-empresario">
                      {ver ? 'Ocultar' : 'Ver'}
                    </button>
                  }
                />
                <Campo
                  id="clave-repetir"
                  etiqueta="Repite la contraseña"
                  type={ver ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={repetir}
                  onChange={(e) => setRepetir(e.target.value)}
                />
              </div>
              {error && (
                <p className="mt-4 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">{error}</p>
              )}
              <Boton variante="empresario" type="submit" className="mt-6" cargando={guardando}>
                Guardar y entrar
              </Boton>
            </>
          )}
        </div>
      </form>
    </AuthShell>
  )
}
