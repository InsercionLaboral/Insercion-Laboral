import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { PopupCard } from '../../components/PopupCard.jsx'
import { getMiEmpresa, listarMisPopups } from '../../lib/popups.js'

export function MisPopups() {
  const { usuario } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [popups, setPopups] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!usuario) return
    getMiEmpresa(usuario.id)
      .then((empresa) => (empresa ? listarMisPopups(empresa.id) : []))
      .then(setPopups)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuario])

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-tinta">Mis pop-ups</h1>
        <Link
          to="/empresario/popups/nuevo"
          className="rounded-2xl bg-joven px-4 py-2.5 font-display text-sm font-semibold text-white shadow-lg shadow-joven/40"
        >
          + Publicar
        </Link>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {popups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <div className="mb-2 text-3xl">⚡</div>
          <p className="font-body text-sm text-tenue">
            Aún no has publicado pop-ups. Crea el primero para recibir postulaciones.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map((p) => (
            <PopupCard
              key={p.id}
              popup={p}
              to={`/empresario/popups/${p.id}`}
              mostrarEstado
              pie={
                <span className="font-body text-[12.5px] font-bold text-tenue">
                  📨 {p.totalPostulaciones}{' '}
                  {p.totalPostulaciones === 1 ? 'postulación' : 'postulaciones'}
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
