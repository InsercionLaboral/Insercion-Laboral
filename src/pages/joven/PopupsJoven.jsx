import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { PopupCard } from '../../components/PopupCard.jsx'
import { EstadoBadge } from '../../components/ui/EstadoBadge.jsx'
import { getMiPerfil } from '../../lib/perfil.js'
import { listarPopupsAprobados, misPostulaciones } from '../../lib/popups.js'

export function PopupsJoven() {
  const { usuario } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [popups, setPopups] = useState([])
  const [misHabilidades, setMisHabilidades] = useState(new Set())
  const [postulacionesPorPopup, setPostulacionesPorPopup] = useState({})
  const [tienePerfil, setTienePerfil] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!usuario) return
    ;(async () => {
      const { perfil, habilidadIds } = await getMiPerfil(usuario.id)
      setTienePerfil(!!perfil)
      setMisHabilidades(new Set(habilidadIds))
      const lista = await listarPopupsAprobados()
      setPopups(lista)
      if (perfil) {
        const posts = await misPostulaciones(perfil.id)
        setPostulacionesPorPopup(Object.fromEntries(posts.map((p) => [p.popup_id, p.estado])))
      }
    })()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuario])

  if (cargando) return <Cargando />

  // Ordena mostrando primero los que más coinciden con mis habilidades.
  const conMatch = popups
    .map((p) => {
      const req = p.habilidades ?? []
      const coinciden = req.filter((h) => misHabilidades.has(h.id)).length
      return { ...p, coinciden, totalReq: req.length }
    })
    .sort((a, b) => b.coinciden - a.coinciden)

  return (
    <div className="py-2">
      <h1 className="mb-1 font-display text-2xl font-bold text-tinta">Pop-ups</h1>
      <p className="mb-4 font-body text-sm text-tenue">
        Oportunidades cortas de contratación por habilidades.
      </p>

      {!tienePerfil && (
        <div className="mb-4 rounded-2xl border border-naranja/40 bg-naranja/10 p-4">
          <p className="font-body text-[13px] text-tinta">
            Crea tu perfil para poder postularte a los pop-ups.
          </p>
          <Link
            to="/joven/perfil"
            className="mt-2 inline-block font-body text-[13px] font-bold text-joven"
          >
            Crear mi perfil →
          </Link>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {conMatch.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <div className="mb-2 text-3xl">⚡</div>
          <p className="font-body text-sm text-tenue">
            Todavía no hay pop-ups publicados. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conMatch.map((p) => {
            const estadoPost = postulacionesPorPopup[p.id]
            return (
              <PopupCard
                key={p.id}
                popup={p}
                to={`/joven/popups/${p.id}`}
                pie={
                  estadoPost ? (
                    <span className="flex items-center gap-2 font-body text-[12.5px] font-bold text-tenue">
                      Tu postulación: <EstadoBadge estado={estadoPost} />
                    </span>
                  ) : p.coinciden > 0 ? (
                    <span className="font-body text-[12.5px] font-bold text-[#5d6c17]">
                      ✨ Coincides en {p.coinciden} de {p.totalReq} habilidades
                    </span>
                  ) : null
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
