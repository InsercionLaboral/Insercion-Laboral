import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../layouts/AuthShell.jsx'
import { Boton } from '../components/ui/Boton.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { enviarCorreoRecuperacion } from '../lib/cuenta.js'

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** "¿Olvidaste tu contraseña?": envía un correo con el enlace para crear una nueva. */
export function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    setError(null)
    if (!emailValido(email)) return setError('Escribe un correo válido.')
    setEnviando(true)
    try {
      await enviarCorreoRecuperacion(email)
      setEnviado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell acento="empresario">
      <form onSubmit={enviar} className="flex flex-1 flex-col justify-center py-6">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-[28px] font-bold leading-tight text-tinta">¿Olvidaste tu contraseña?</h1>
          {enviado ? (
            <>
              <p className="mt-3 rounded-2xl bg-lima/30 px-4 py-3 font-body text-[14px] text-tinta">
                Si <b>{email}</b> tiene una cuenta, te enviamos un correo con un enlace para crear una contraseña nueva.
                Revisa también la carpeta de correo no deseado.
              </p>
              <p className="mt-3 font-body text-[13px] text-tenue">
                ¿No te llegó en unos minutos? Pídele al equipo de Inserción Laboral que te asigne una contraseña nueva.
              </p>
            </>
          ) : (
            <>
              <p className="mb-6 mt-1 font-body text-[14.5px] text-tenue">
                Escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva.
              </p>
              <Campo
                id="email-recuperar"
                etiqueta="Correo electrónico"
                icono="✉️"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
              {error && (
                <p className="mt-4 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
                  {error} Si no se resuelve, pídele al equipo de Inserción Laboral que te asigne una contraseña nueva.
                </p>
              )}
              <Boton variante="empresario" type="submit" className="mt-6" cargando={enviando}>
                Enviarme el enlace
              </Boton>
            </>
          )}
          <p className="mt-5 text-center font-body text-[13.5px] text-tenue">
            <Link to="/login" className="font-bold text-empresario">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
