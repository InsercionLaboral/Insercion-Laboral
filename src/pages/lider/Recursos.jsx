import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { Boton } from '../../components/ui/Boton.jsx'
import { Campo } from '../../components/ui/Campo.jsx'
import { Selector } from '../../components/ui/Selector.jsx'
import {
  TIPOS_RECURSO,
  actualizarRecurso,
  crearRecurso,
  eliminarRecurso,
  infoTipo,
  listarRecursos,
} from '../../lib/recursos.js'

const VACIO = { tipo: '', titulo: '', descripcion: '', url_recurso: '' }

/** Gestión de la biblioteca de recursos (líder / admin): crear, editar y quitar. */
export function RecursosGestion() {
  const { usuario } = useAuth()
  const [recursos, setRecursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [editandoId, setEditandoId] = useState(null) // id | 'nuevo' | null
  const [f, setF] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => setRecursos(await listarRecursos()), [])

  useEffect(() => {
    cargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cargar])

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  function abrirNuevo() {
    setEditandoId('nuevo')
    setF(VACIO)
    setError(null)
    setAviso(null)
  }

  function abrirEdicion(r) {
    setEditandoId(r.id)
    setF({
      tipo: r.tipo,
      titulo: r.titulo,
      descripcion: r.descripcion ?? '',
      url_recurso: r.url_recurso ?? '',
    })
    setError(null)
    setAviso(null)
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      if (editandoId === 'nuevo') await crearRecurso(f, usuario.id)
      else await actualizarRecurso(editandoId, f)
      await cargar()
      setAviso(editandoId === 'nuevo' ? 'Recurso publicado.' : 'Cambios guardados.')
      setEditandoId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function quitar(r) {
    if (!window.confirm(`¿Quitar "${r.titulo}"? Las inscripciones de los jóvenes también se borrarán.`)) return
    setError(null)
    try {
      await eliminarRecurso(r.id)
      await cargar()
      setAviso('Recurso eliminado.')
    } catch (err) {
      setError(err.message)
    }
  }

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-tinta">Recursos educativos</h1>
        {editandoId === null && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="rounded-2xl bg-joven px-4 py-2.5 font-display text-sm font-semibold text-white"
          >
            + Nuevo
          </button>
        )}
      </div>
      <p className="mb-4 font-body text-sm text-tenue">
        Lo que publiques aquí lo verán todos los jóvenes y podrán inscribirse.
      </p>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mb-3 rounded-xl bg-lima/30 px-3 py-2 font-body text-[13px] font-semibold text-[#5d6c17]">
          {aviso}
        </p>
      )}

      {editandoId !== null && (
        <form onSubmit={guardar} className="mb-5 space-y-3.5 rounded-3xl border border-borde bg-superficie p-4">
          <h2 className="font-display text-lg font-bold text-tinta">
            {editandoId === 'nuevo' ? 'Nuevo recurso' : 'Editar recurso'}
          </h2>
          <Selector
            id="tipo-recurso"
            etiqueta="Tipo"
            opciones={TIPOS_RECURSO.map((t) => ({ value: t.valor, label: `${t.icono} ${t.texto}` }))}
            value={f.tipo}
            onChange={(e) => set('tipo', e.target.value)}
            placeholder="Elige el tipo"
          />
          <Campo
            id="titulo-recurso"
            etiqueta="Título"
            value={f.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            maxLength={120}
            placeholder="Ej: Taller de atención al cliente"
          />
          <div>
            <label htmlFor="desc-recurso" className="mb-1.5 block font-body text-[13.5px] font-bold text-tinta">
              Descripción
            </label>
            <textarea
              id="desc-recurso"
              value={f.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="¿De qué trata y para quién es?"
              className="w-full rounded-2xl border border-borde bg-white px-3.5 py-3 font-body text-[14px] text-tinta outline-none"
            />
          </div>
          <Campo
            id="url-recurso"
            etiqueta="Enlace (opcional)"
            value={f.url_recurso}
            onChange={(e) => set('url_recurso', e.target.value)}
            ayuda="Lo verán solo los jóvenes que se inscriban."
            placeholder="https://…"
          />
          <div className="flex gap-3">
            <Boton type="submit" variante="joven" cargando={guardando}>
              {editandoId === 'nuevo' ? 'Publicar' : 'Guardar'}
            </Boton>
            <Boton variante="contorno" onClick={() => setEditandoId(null)} disabled={guardando}>
              Cancelar
            </Boton>
          </div>
        </form>
      )}

      {recursos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <p className="font-body text-sm text-tenue">Aún no has publicado recursos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recursos.map((r) => {
            const info = infoTipo(r.tipo)
            return (
              <div key={r.id} className="rounded-2xl border border-borde bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lima/40 text-2xl">
                    {info.icono}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[11px] font-bold uppercase tracking-wide text-tenue">
                      {info.texto} · {r.inscritos} {r.inscritos === 1 ? 'inscrito' : 'inscritos'}
                    </p>
                    <h2 className="font-display text-[16px] font-semibold leading-snug text-tinta">{r.titulo}</h2>
                    {r.descripcion && (
                      <p className="mt-1 font-body text-[13.5px] leading-snug text-[#3f4133]">{r.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(r)}
                    className="rounded-full border border-borde px-4 py-1.5 font-body text-[12.5px] font-bold text-tinta"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(r)}
                    className="rounded-full bg-joven/10 px-4 py-1.5 font-body text-[12.5px] font-bold text-joven"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
