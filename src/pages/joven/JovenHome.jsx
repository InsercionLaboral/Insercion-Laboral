import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { getMiPerfil, setDisponible } from '../../lib/perfil.js'

const ESTADO_INFO = {
  sin_perfil: {
    titulo: 'Aún no has creado tu perfil',
    texto: 'Arma tu portafolio para que los empresarios te encuentren.',
    clase: 'bg-borde text-tenue',
    etiqueta: 'Sin perfil',
  },
  borrador: {
    titulo: 'Tu perfil está en borrador',
    texto: 'Termínalo y envíalo a revisión para aparecer en el directorio.',
    clase: 'bg-borde text-tenue',
    etiqueta: 'Borrador',
  },
  en_revision: {
    titulo: 'Tu perfil está en revisión',
    texto: 'Un líder de área lo revisará pronto. Te avisaremos.',
    clase: 'bg-naranja/20 text-[#B96C00]',
    etiqueta: 'En revisión',
  },
  aprobado: {
    titulo: '¡Tu perfil está publicado! 🎉',
    texto: 'Ya apareces en el directorio de talento.',
    clase: 'bg-tinta text-lima',
    etiqueta: '✓ Verificado',
  },
  rechazado: {
    titulo: 'Tu perfil necesita cambios',
    texto: 'Revisa las observaciones, ajústalo y envíalo de nuevo.',
    clase: 'bg-joven/15 text-joven',
    etiqueta: 'Necesita cambios',
  },
}

export function JovenHome() {
  const { usuario } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [guardandoDisp, setGuardandoDisp] = useState(false)

  useEffect(() => {
    if (!usuario) return
    getMiPerfil(usuario.id)
      .then(({ perfil }) => setPerfil(perfil))
      .finally(() => setCargando(false))
  }, [usuario])

  async function alternarDisponible() {
    if (!perfil) return
    setGuardandoDisp(true)
    const nuevo = !perfil.disponible
    try {
      await setDisponible(perfil.id, nuevo)
      setPerfil((p) => ({ ...p, disponible: nuevo }))
    } finally {
      setGuardandoDisp(false)
    }
  }

  if (cargando) return <Cargando />

  const clave = !perfil ? 'sin_perfil' : perfil.estado_revision
  const info = ESTADO_INFO[clave] ?? ESTADO_INFO.borrador

  return (
    <div className="py-2">
      <p className="font-body text-sm text-tenue">Hola,</p>
      <h1 className="mb-5 font-display text-2xl font-bold text-tinta">
        {usuario?.nombre?.split(' ')[0] ?? 'Bienvenida'} 🌱
      </h1>

      {/* Tarjeta de estado del perfil */}
      <div className="rounded-3xl border border-borde bg-superficie p-5">
        <span
          className={`inline-flex rounded-full px-3 py-1 font-body text-[11.5px] font-bold ${info.clase}`}
        >
          {info.etiqueta}
        </span>
        <h2 className="mt-3 font-display text-lg font-bold text-tinta">{info.titulo}</h2>
        <p className="mt-1 font-body text-sm text-tenue">{info.texto}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/joven/perfil"
            className="rounded-2xl bg-joven px-4 py-2.5 font-display text-sm font-semibold text-white shadow-lg shadow-joven/40"
          >
            {perfil ? 'Editar perfil' : 'Crear mi perfil'}
          </Link>
          {perfil && (
            <Link
              to="/joven/portafolio"
              className="rounded-2xl border border-borde bg-white px-4 py-2.5 font-display text-sm font-semibold text-tinta"
            >
              Ver mi portafolio
            </Link>
          )}
        </div>
      </div>

      {/* Disponibilidad */}
      {perfil && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-4">
          <span
            className={`size-3 rounded-full ${perfil.disponible ? 'bg-[#2FB863] ring-4 ring-[#2FB863]/20' : 'bg-tenue'}`}
          />
          <div className="flex-1">
            <p className="font-body text-sm font-bold text-tinta">
              {perfil.disponible ? 'Disponible para pop-ups' : 'No disponible'}
            </p>
            <p className="font-body text-xs text-tenue">Controla si te muestran como disponible.</p>
          </div>
          <button
            onClick={alternarDisponible}
            disabled={guardandoDisp}
            className={`relative h-7 w-12 rounded-full transition ${
              perfil.disponible ? 'bg-[#2FB863]' : 'bg-borde'
            } disabled:opacity-60`}
            aria-label="Alternar disponibilidad"
          >
            <span
              className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${
                perfil.disponible ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  )
}
