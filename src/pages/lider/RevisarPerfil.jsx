import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { FichaPerfil } from '../../components/FichaPerfil.jsx'
import { getPerfilPublico } from '../../lib/perfil.js'
import { getPerfilPorUsuario, revisarPerfil } from '../../lib/aprobaciones.js'

/** Revisión en detalle de un perfil de joven, con aprobar/rechazar. */
export function RevisarPerfil() {
  const { usuarioId } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [ficha, setFicha] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getPerfilPublico(usuarioId), getPerfilPorUsuario(usuarioId)])
      .then(([f, p]) => {
        setFicha(f)
        setPerfil(p)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuarioId])

  async function decidir(aprobado) {
    setOcupado(true)
    setError(null)
    try {
      await revisarPerfil({ perfilId: perfil.id, aprobado, revisorId: usuario.id })
      navigate('/lider', { replace: true })
    } catch (e) {
      setError(e.message)
      setOcupado(false)
    }
  }

  if (cargando) return <Cargando />
  if (!ficha || !perfil) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-xl font-bold text-tinta">Perfil no encontrado</h1>
        <Link to="/lider" className="mt-4 inline-block font-body text-sm font-bold text-empresario">
          ← Volver a aprobaciones
        </Link>
      </div>
    )
  }

  return (
    <div className="py-2">
      <Link to="/lider" className="mb-3 inline-block font-body text-sm font-bold text-empresario">
        ← Aprobaciones
      </Link>

      <FichaPerfil perfil={ficha} vistaEmpresario={false} />

      {error && (
        <p className="mt-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {perfil.estado_revision === 'en_revision' ? (
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => decidir(false)}
            disabled={ocupado}
            className="flex-1 rounded-xl border border-[#F1B5B5] bg-white py-3 font-body text-[14px] font-bold text-[#C23B3B] disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => decidir(true)}
            disabled={ocupado}
            className="flex-[1.4] rounded-xl bg-[#2FB863] py-3 font-display text-[14px] font-semibold text-white disabled:opacity-50"
          >
            ✓ Aprobar
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-fondo px-3 py-2.5 text-center font-body text-[13px] text-tenue">
          Este perfil ya fue revisado (estado: {perfil.estado_revision}).
        </p>
      )}
    </div>
  )
}
