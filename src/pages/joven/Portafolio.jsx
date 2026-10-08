import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { FichaPerfil } from '../../components/FichaPerfil.jsx'
import { useProyectos } from '../../hooks/useProyectos.js'
import { getPerfilPublico } from '../../lib/perfil.js'

/** Vista previa del portafolio propio del joven (como se verá públicamente). */
export function Portafolio() {
  const { usuario } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const proyectos = useProyectos(usuario?.id)

  useEffect(() => {
    if (!usuario) return
    getPerfilPublico(usuario.id)
      .then(setPerfil)
      .finally(() => setCargando(false))
  }, [usuario])

  if (cargando) return <Cargando />

  if (!perfil) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-lima/40 text-3xl">
          📝
        </div>
        <h1 className="font-display text-xl font-bold text-tinta">Aún no tienes portafolio</h1>
        <p className="mx-auto mt-1 max-w-xs font-body text-sm text-tenue">
          Crea tu perfil para ver aquí cómo te presentarán ante los empresarios.
        </p>
        <Link
          to="/joven/perfil"
          className="mt-5 inline-block rounded-2xl bg-joven px-5 py-3 font-display font-semibold text-white"
        >
          Crear mi perfil
        </Link>
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-tinta">Tu portafolio</h1>
        <Link to="/joven/perfil" className="font-body text-sm font-bold text-empresario">
          Editar
        </Link>
      </div>
      <FichaPerfil perfil={perfil} proyectos={proyectos} vistaEmpresario={false} />
    </div>
  )
}
