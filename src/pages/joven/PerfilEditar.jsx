import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Campo } from '../../components/ui/Campo.jsx'
import { Boton } from '../../components/ui/Boton.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { SelectorHabilidades } from '../../components/SelectorHabilidades.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { getMiPerfil, guardarPerfil, subirFoto } from '../../lib/perfil.js'
import {
  MAX_PROYECTOS,
  guardarProyectos,
  listarProyectosDeUsuario,
} from '../../lib/proyectos.js'

export function PerfilEditar() {
  const { usuario, session } = useAuth()
  const navigate = useNavigate()
  const inputFoto = useRef(null)

  const [cargando, setCargando] = useState(true)
  const [estado, setEstado] = useState('borrador')
  const [motivo, setMotivo] = useState(null)
  const [f, setF] = useState({
    formacion: '',
    presentacion: '',
    telefono: '',
    disponible: true,
    foto_url: '',
  })
  const [habilidadIds, setHabilidadIds] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [proyectosDisponibles, setProyectosDisponibles] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!usuario) return
    getMiPerfil(usuario.id)
      .then(({ perfil, habilidadIds }) => {
        if (perfil) {
          setEstado(perfil.estado_revision)
          setMotivo(perfil.motivo_revision ?? null)
          setF({
            formacion: perfil.formacion ?? '',
            presentacion: perfil.presentacion ?? '',
            telefono: perfil.telefono ?? '',
            disponible: perfil.disponible,
            foto_url: perfil.foto_url ?? '',
          })
          setHabilidadIds(habilidadIds)
        }
        return listarProyectosDeUsuario(usuario.id).then(({ disponible, items }) => {
          setProyectosDisponibles(disponible)
          setProyectos(
            items.map(({ titulo, descripcion, enlace }) => ({
              titulo,
              descripcion: descripcion ?? '',
              enlace: enlace ?? '',
            })),
          )
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuario])

  async function onFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSubiendoFoto(true)
    try {
      const url = await subirFoto(session.user.id, file)
      set('foto_url', url)
    } catch (err) {
      setError('No se pudo subir la foto: ' + err.message)
    } finally {
      setSubiendoFoto(false)
      if (inputFoto.current) inputFoto.current.value = ''
    }
  }

  const cambiarProyecto = (i, campo, valor) =>
    setProyectos((prev) => prev.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)))
  const quitarProyecto = (i) => setProyectos((prev) => prev.filter((_, j) => j !== i))
  const agregarProyecto = () =>
    setProyectos((prev) =>
      prev.length >= MAX_PROYECTOS ? prev : [...prev, { titulo: '', descripcion: '', enlace: '' }],
    )

  async function guardar(enviarRevision) {
    setError(null)
    setOk(null)
    const proyectosLlenos = proyectos.filter(
      (p) => p.titulo.trim() || p.descripcion.trim() || p.enlace.trim(),
    )
    if (proyectosLlenos.some((p) => p.titulo.trim().length < 3))
      return setError('Cada proyecto necesita un título (mínimo 3 letras).')
    if (enviarRevision) {
      if (!f.presentacion.trim()) return setError('Escribe una breve presentación antes de enviar.')
      if (habilidadIds.length === 0) return setError('Agrega al menos una habilidad antes de enviar.')
    }
    setGuardando(true)
    try {
      const perfil = await guardarPerfil({
        usuarioId: usuario.id,
        datos: f,
        habilidadIds,
        enviarRevision,
      })
      if (proyectosDisponibles) await guardarProyectos(perfil.id, proyectosLlenos)
      setEstado(perfil.estado_revision)
      if (enviarRevision) {
        navigate('/joven', { replace: true })
      } else {
        setOk('Cambios guardados como borrador.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Arma tu portafolio</h1>
      <p className="mb-5 mt-1 font-body text-sm text-tenue">Esto es lo que verán los empresarios.</p>

      {estado === 'rechazado' && motivo && (
        <div className="mb-5 rounded-2xl border border-joven/30 bg-joven/10 p-4">
          <p className="font-body text-[13px] font-bold text-joven">Tu perfil necesita cambios</p>
          <p className="mt-1 font-body text-[14px] text-tinta">{motivo}</p>
          <p className="mt-2 font-body text-xs text-tenue">Haz los ajustes y toca “Guardar y enviar a revisión”.</p>
        </div>
      )}

      {/* Foto + nombre */}
      <div className="mb-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputFoto.current?.click()}
          className="relative shrink-0"
          aria-label="Cambiar foto"
        >
          <Avatar nombre={usuario?.nombre} fotoUrl={f.foto_url} className="size-20" texto="text-2xl" />
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-fondo bg-empresario text-xs text-white">
            {subiendoFoto ? '…' : '📷'}
          </span>
        </button>
        <input ref={inputFoto} type="file" accept="image/*" onChange={onFoto} className="hidden" />
        <div className="min-w-0">
          <p className="font-body text-[13px] font-bold text-tinta">{usuario?.nombre}</p>
          <p className="font-body text-xs text-tenue">Toca la foto para cambiarla (se comprime sola).</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-body text-[13.5px] font-bold text-tinta">Sobre mí</label>
          <textarea
            value={f.presentacion}
            onChange={(e) => set('presentacion', e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Cuéntale a los empresarios quién eres y qué te apasiona…"
            className="w-full rounded-2xl border border-borde bg-white px-3.5 py-3 font-body text-[14px] text-tinta outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-body text-[13.5px] font-bold text-tinta">
            Formación técnica
          </label>
          <textarea
            value={f.formacion}
            onChange={(e) => set('formacion', e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Ej: Técnico en Producción Cafetera — La Universidad en el Campo, 2024"
            className="w-full rounded-2xl border border-borde bg-white px-3.5 py-3 font-body text-[14px] text-tinta outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block font-body text-[13.5px] font-bold text-tinta">Habilidades</label>
          <SelectorHabilidades seleccionadas={habilidadIds} onCambio={setHabilidadIds} />
        </div>

        {proyectosDisponibles && (
          <div>
            <label className="mb-1 block font-body text-[13.5px] font-bold text-tinta">
              Proyectos destacados
            </label>
            <p className="mb-2 font-body text-xs text-tenue">
              Muestra hasta {MAX_PROYECTOS} trabajos o proyectos de los que te sientas orgulloso.
            </p>
            <div className="space-y-3">
              {proyectos.map((p, i) => (
                <div key={i} className="rounded-2xl border border-borde bg-white p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-body text-xs font-bold text-tenue">Proyecto {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => quitarProyecto(i)}
                      className="font-body text-xs font-bold text-joven"
                    >
                      Quitar
                    </button>
                  </div>
                  <input
                    value={p.titulo}
                    onChange={(e) => cambiarProyecto(i, 'titulo', e.target.value)}
                    maxLength={120}
                    placeholder="Nombre del proyecto"
                    aria-label={`Nombre del proyecto ${i + 1}`}
                    className="mb-2 w-full rounded-xl border border-borde bg-fondo/50 px-3 py-2.5 font-body text-[14px] text-tinta outline-none"
                  />
                  <textarea
                    value={p.descripcion}
                    onChange={(e) => cambiarProyecto(i, 'descripcion', e.target.value)}
                    rows={2}
                    maxLength={600}
                    placeholder="¿Qué hiciste y qué lograste?"
                    aria-label={`Descripción del proyecto ${i + 1}`}
                    className="mb-2 w-full rounded-xl border border-borde bg-fondo/50 px-3 py-2.5 font-body text-[14px] text-tinta outline-none"
                  />
                  <input
                    value={p.enlace}
                    onChange={(e) => cambiarProyecto(i, 'enlace', e.target.value)}
                    maxLength={500}
                    placeholder="Enlace (opcional)"
                    aria-label={`Enlace del proyecto ${i + 1}`}
                    className="w-full rounded-xl border border-borde bg-fondo/50 px-3 py-2.5 font-body text-[14px] text-tinta outline-none"
                  />
                </div>
              ))}
            </div>
            {proyectos.length < MAX_PROYECTOS && (
              <button
                type="button"
                onClick={agregarProyecto}
                className="mt-2.5 w-full rounded-2xl border border-dashed border-tenue/50 bg-white/60 py-3 font-body text-[13.5px] font-bold text-tinta"
              >
                + Agregar un proyecto
              </button>
            )}
          </div>
        )}

        <Campo
          etiqueta="WhatsApp de contacto"
          icono="📱"
          type="tel"
          value={f.telefono}
          onChange={(e) => set('telefono', e.target.value)}
          ayuda="Los empresarios te escribirán por aquí. Opcional."
          placeholder="300 123 4567"
        />

        <label className="flex items-center justify-between rounded-2xl border border-borde bg-white px-4 py-3.5">
          <span className="font-body text-[14px] font-bold text-tinta">Disponible para pop-ups</span>
          <input
            type="checkbox"
            checked={f.disponible}
            onChange={(e) => set('disponible', e.target.checked)}
            className="size-5 accent-[#2FB863]"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-4 rounded-xl bg-lima/30 px-3 py-2 font-body text-[13px] font-semibold text-[#5d6c17]">
          {ok}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <Boton variante="joven" cargando={guardando} onClick={() => guardar(true)}>
          Guardar y enviar a revisión
        </Boton>
        <button
          type="button"
          onClick={() => guardar(false)}
          disabled={guardando}
          className="w-full font-body text-sm font-bold text-tenue disabled:opacity-50"
        >
          Guardar borrador
        </button>
      </div>
      <p className="mt-3 text-center font-body text-xs text-tenue">
        Un líder de área revisará tu perfil antes de publicarlo. 🔎
      </p>
      {estado === 'rechazado' && (
        <p className="mt-2 text-center font-body text-xs font-semibold text-joven">
          Tu perfil necesita cambios. Ajusta y vuelve a enviarlo.
        </p>
      )}
    </div>
  )
}
