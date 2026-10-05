import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../layouts/AuthShell.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { Boton } from '../components/ui/Boton.jsx'
import { iniciarSesion } from '../lib/auth.js'

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    setErrorGeneral(null)
    const errs = {}
    if (!emailValido(email)) errs.email = 'Correo no válido.'
    if (!password) errs.password = 'Ingresa tu contraseña.'
    setErrores(errs)
    if (Object.keys(errs).length) return

    setEnviando(true)
    try {
      await iniciarSesion({ email: email.trim(), password })
      // RedirigirPorRol decide el destino según rol / onboarding.
      navigate('/entrar', { replace: true })
    } catch (err) {
      setErrorGeneral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell acento="empresario">
      <form onSubmit={enviar} className="flex flex-1 flex-col justify-center py-6">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <img
              src="/assets/logo.jpg"
              alt="Inserción Laboral"
              className="h-16 rounded-2xl shadow-lg shadow-black/10"
            />
          </div>

          <h1 className="font-display text-[28px] font-bold leading-tight text-tinta">
            Bienvenido de vuelta
          </h1>
          <p className="mb-6 mt-1 font-body text-[14.5px] text-tenue">
            Inicia sesión para continuar.
          </p>

          <div className="space-y-4">
            <Campo
              id="email"
              etiqueta="Correo electrónico"
              icono="✉️"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errores.email}
              placeholder="tucorreo@ejemplo.com"
            />
            <Campo
              id="password"
              etiqueta="Contraseña"
              icono="🔒"
              type={verPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errores.password}
              placeholder="••••••••"
              sufijo={
                <button
                  type="button"
                  onClick={() => setVerPass((v) => !v)}
                  className="font-body text-[13px] font-bold text-empresario"
                >
                  {verPass ? 'Ocultar' : 'Ver'}
                </button>
              }
            />
          </div>

          {errorGeneral && (
            <p className="mt-4 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
              {errorGeneral}
            </p>
          )}

          <Boton variante="empresario" type="submit" className="mt-6" cargando={enviando}>
            Iniciar sesión
          </Boton>

          <p className="mt-5 text-center font-body text-[13.5px] text-tenue">
            ¿No tienes cuenta?{' '}
            <Link to="/" className="font-bold text-joven">
              Regístrate
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
