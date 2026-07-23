import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Cargando } from '../../components/Cargando.jsx'
import { FichaPerfil } from '../../components/FichaPerfil.jsx'
import { getPerfilPublico } from '../../lib/perfil.js'

/** Ficha pública de un joven, vista por el empresario (con contacto wa.me). */
export function PerfilTalento() {
  const { usuarioId } = useParams()
  const [cargando, setCargando] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    getPerfilPublico(usuarioId)
      .then(setPerfil)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuarioId])

  if (cargando) return <Cargando />

  if (error || !perfil) {
    return (
      <div className="py-10 text-center">
        <h1 className="font-display text-xl font-bold text-tinta">Perfil no disponible</h1>
        <p className="mt-1 font-body text-sm text-tenue">
          Este perfil no existe o aún no está publicado.
        </p>
        <Link to="/empresario" className="mt-5 inline-block font-body text-sm font-bold text-empresario">
          ← Volver al directorio
        </Link>
      </div>
    )
  }

  return (
    <div className="py-2">
      <Link to="/empresario" className="mb-3 inline-block font-body text-sm font-bold text-empresario">
        ← Volver al directorio
      </Link>
      <FichaPerfil perfil={perfil} vistaEmpresario />
    </div>
  )
}
