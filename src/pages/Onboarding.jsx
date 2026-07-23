import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import { Boton } from '../components/ui/Boton.jsx'
import { completarOnboarding } from '../lib/auth.js'
import { ROLES, HOME_POR_ROL } from '../constants/roles.js'

const PASOS_JOVEN = [
  { emoji: '🌱', titulo: 'Muestra lo que sabes hacer', texto: 'Arma tu perfil con tu formación técnica, tus habilidades y tu portafolio. Así los empresarios te encuentran por lo que sabes hacer.' },
  { emoji: '🚀', titulo: 'Aprovecha las oportunidades', texto: 'Recibe pop-ups de contratación en tu municipio y postúlate con un toque. Contratación por habilidades, no por hoja de vida.' },
  { emoji: '📚', titulo: 'Sigue creciendo', texto: 'Accede a cursos, talleres y mentorías para fortalecer tus competencias mientras encuentras trabajo.' },
]

const PASOS_EMPRESARIO = [
  { emoji: '🔎', titulo: 'Encuentra talento por habilidades', texto: 'Explora el directorio de jóvenes egresados de La Universidad en el Campo y filtra por habilidad y municipio.' },
  { emoji: '📣', titulo: 'Publica pop-ups', texto: 'Crea oportunidades puntuales de contratación por habilidad. Nuestro equipo las revisa y las jóvenes con ese perfil se postulan.' },
  { emoji: '🤝', titulo: 'Contrata y haz seguimiento', texto: 'Marca contrataciones y aporta a la medición de impacto de la inserción laboral en Caldas.' },
]

const ACENTO_BG = {
  [ROLES.JOVEN]: 'bg-lima/40',
  [ROLES.EMPRESARIO]: 'bg-empresario/10',
}

export function Onboarding() {
  const navigate = useNavigate()
  const { usuario, refrescarUsuario } = useAuth()
  const esJoven = usuario?.rol === ROLES.JOVEN
  const acento = esJoven ? 'joven' : 'empresario'
  const pasos = esJoven ? PASOS_JOVEN : PASOS_EMPRESARIO

  const [i, setI] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const ultimo = i === pasos.length - 1
  const p = pasos[i]

  async function siguiente() {
    if (!ultimo) {
      setI((v) => v + 1)
      return
    }
    setGuardando(true)
    try {
      if (usuario) await completarOnboarding(usuario.id)
      await refrescarUsuario()
      navigate(HOME_POR_ROL[usuario?.rol] ?? '/', { replace: true })
    } catch {
      // Si falla el guardado, igual dejamos entrar; se reintentará luego.
      navigate(HOME_POR_ROL[usuario?.rol] ?? '/', { replace: true })
    } finally {
      setGuardando(false)
    }
  }

  async function omitir() {
    setGuardando(true)
    try {
      if (usuario) await completarOnboarding(usuario.id)
      await refrescarUsuario()
    } finally {
      navigate(HOME_POR_ROL[usuario?.rol] ?? '/', { replace: true })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-fondo px-6 py-8">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {pasos.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === i
                    ? `w-7 ${esJoven ? 'bg-joven' : 'bg-empresario'}`
                    : 'w-2 bg-borde'
                }`}
              />
            ))}
          </div>
          {!ultimo && (
            <button
              onClick={omitir}
              disabled={guardando}
              className="font-body text-[13px] font-bold text-tenue"
            >
              Omitir
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className={`mb-8 flex size-28 items-center justify-center rounded-[2rem] text-6xl ${ACENTO_BG[usuario?.rol] ?? 'bg-lima/40'}`}>
            {p.emoji}
          </div>
          <h1 className="font-display text-[26px] font-bold leading-tight text-tinta">
            {p.titulo}
          </h1>
          <p className="mt-3 max-w-xs font-body text-[15px] leading-relaxed text-tenue">
            {p.texto}
          </p>
        </div>

        <Boton variante={acento} cargando={guardando} onClick={siguiente}>
          {ultimo ? 'Empezar' : 'Siguiente'}
        </Boton>
      </div>
    </div>
  )
}
