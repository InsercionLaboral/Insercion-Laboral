import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { getMiPerfil } from '../../lib/perfil.js'
import { enlaceSeguro } from '../../lib/proyectos.js'
import {
  TIPOS_RECURSO,
  cancelarInscripcion,
  infoTipo,
  inscribirse,
  listarRecursos,
  misInscripciones,
} from '../../lib/recursos.js'

/** Biblioteca de recursos de formación para el joven, con inscripción. */
export function Recursos() {
  const { usuario } = useAuth()
  const [recursos, setRecursos] = useState([])
  const [perfilId, setPerfilId] = useState(null)
  const [inscritos, setInscritos] = useState(new Set())
  const [tipo, setTipo] = useState('todos')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ocupado, setOcupado] = useState(null)

  useEffect(() => {
    if (!usuario) return
    ;(async () => {
      const [lista, { perfil }] = await Promise.all([listarRecursos(), getMiPerfil(usuario.id)])
      setRecursos(lista)
      if (perfil) {
        setPerfilId(perfil.id)
        setInscritos(await misInscripciones(perfil.id))
      }
    })()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuario])

  const visibles = useMemo(
    () => (tipo === 'todos' ? recursos : recursos.filter((r) => r.tipo === tipo)),
    [recursos, tipo],
  )

  async function alternar(recurso) {
    setOcupado(recurso.id)
    setError(null)
    try {
      if (inscritos.has(recurso.id)) {
        await cancelarInscripcion(recurso.id, perfilId)
        setInscritos((prev) => {
          const n = new Set(prev)
          n.delete(recurso.id)
          return n
        })
      } else {
        await inscribirse(recurso.id, perfilId)
        setInscritos((prev) => new Set(prev).add(recurso.id))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Recursos para ti</h1>
      <p className="mb-4 mt-1 font-body text-sm text-tenue">
        Cursos, talleres, mentorías y más para seguir creciendo. Inscríbete en los que te interesen.
      </p>

      {!perfilId && (
        <div className="mb-4 rounded-2xl border border-naranja/40 bg-naranja/10 p-4">
          <p className="font-body text-sm text-[#B96C00]">
            Para inscribirte primero crea tu perfil.{' '}
            <Link to="/joven/perfil" className="font-bold underline">
              Crear mi perfil
            </Link>
          </p>
        </div>
      )}

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        <Filtro activo={tipo === 'todos'} onClick={() => setTipo('todos')}>
          Todos
        </Filtro>
        {TIPOS_RECURSO.map((t) => (
          <Filtro key={t.valor} activo={tipo === t.valor} onClick={() => setTipo(t.valor)}>
            {t.icono} {t.texto}
          </Filtro>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <p className="font-body text-sm text-tenue">
            {recursos.length === 0
              ? 'Pronto habrá recursos disponibles aquí.'
              : 'No hay recursos de este tipo por ahora.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map((r) => {
            const info = infoTipo(r.tipo)
            const estaInscrito = inscritos.has(r.id)
            const enlace = enlaceSeguro(r.url_recurso)
            return (
              <div key={r.id} className="rounded-2xl border border-borde bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lima/40 text-2xl">
                    {info.icono}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[11px] font-bold uppercase tracking-wide text-tenue">
                      {info.texto}
                    </p>
                    <h2 className="font-display text-[16px] font-semibold leading-snug text-tinta">{r.titulo}</h2>
                    {r.descripcion && (
                      <p className="mt-1 font-body text-[13.5px] leading-snug text-[#3f4133]">{r.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {perfilId && (
                    <button
                      type="button"
                      disabled={ocupado === r.id}
                      onClick={() => alternar(r)}
                      className={`rounded-full px-4 py-2 font-body text-[13px] font-bold disabled:opacity-50 ${
                        estaInscrito ? 'bg-tinta text-lima' : 'bg-joven text-white'
                      }`}
                    >
                      {estaInscrito ? '✓ Inscrito · Cancelar' : 'Inscribirme'}
                    </button>
                  )}
                  {enlace && estaInscrito && (
                    <a
                      href={enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-borde px-4 py-2 font-body text-[13px] font-bold text-tinta"
                    >
                      Abrir recurso ↗
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Filtro({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 font-body text-[12.5px] font-bold ${
        activo ? 'bg-tinta text-white' : 'border border-borde bg-white text-tenue'
      }`}
    >
      {children}
    </button>
  )
}
