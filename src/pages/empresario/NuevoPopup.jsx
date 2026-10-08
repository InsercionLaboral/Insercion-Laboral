import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Campo } from '../../components/ui/Campo.jsx'
import { SelectorMunicipio } from '../../components/SelectorMunicipio.jsx'
import { Boton } from '../../components/ui/Boton.jsx'
import { SelectorHabilidades } from '../../components/SelectorHabilidades.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { crearPopup, getMiEmpresa } from '../../lib/popups.js'

export function NuevoPopup() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [errores, setErrores] = useState({})
  const [habilidadIds, setHabilidadIds] = useState([])

  const [f, setF] = useState({
    titulo: '',
    descripcion: '',
    municipio_id: '',
    cupos: '',
    pago_estimado: '',
    fecha_inicio: '',
    fecha_fin: '',
    fecha_cierre: '',
  })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!usuario) return
    getMiEmpresa(usuario.id)
      .then((e) => {
        setEmpresa(e)
        if (e?.municipio_id) set('municipio_id', e.municipio_id)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuario])

  async function enviar() {
    setError(null)
    const errs = {}
    if (!f.titulo.trim()) errs.titulo = 'Ponle un título a la oportunidad.'
    if (!f.descripcion.trim()) errs.descripcion = 'Describe la oportunidad.'
    if (habilidadIds.length === 0) errs.habilidades = 'Selecciona al menos una habilidad.'
    if (f.fecha_inicio && f.fecha_fin && f.fecha_fin < f.fecha_inicio)
      errs.fecha_fin = 'La fecha final no puede ser anterior al inicio.'
    setErrores(errs)
    if (Object.keys(errs).length) return

    if (!empresa) return setError('No encontramos tu empresa. Contacta al administrador.')

    setEnviando(true)
    try {
      await crearPopup({ empresaId: empresa.id, datos: f, habilidadIds })
      navigate('/empresario/popups', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Nuevo pop-up</h1>
      <span className="mt-2 inline-flex rounded-full bg-naranja/15 px-3 py-1 font-body text-[12px] font-bold text-[#B96C00]">
        ⚡ Contratación corta por habilidades
      </span>

      <div className="mt-5 space-y-4">
        <Campo
          etiqueta="Título de la oportunidad"
          value={f.titulo}
          onChange={(e) => set('titulo', e.target.value)}
          error={errores.titulo}
          placeholder="Apoyo en cosecha y poscosecha"
        />

        <div>
          <label className="mb-1.5 block font-body text-[13.5px] font-bold text-tinta">
            Descripción
          </label>
          <textarea
            value={f.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="Cuenta qué se va a hacer, qué se aprende y qué incluye…"
            className="w-full rounded-2xl border border-borde bg-white px-3.5 py-3 font-body text-[14px] text-tinta outline-none"
          />
          {errores.descripcion && (
            <p className="mt-1 font-body text-xs font-semibold text-joven">{errores.descripcion}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-body text-[13.5px] font-bold text-tinta">
            Habilidades requeridas
          </label>
          <SelectorHabilidades seleccionadas={habilidadIds} onCambio={setHabilidadIds} />
          {errores.habilidades && (
            <p className="mt-1 font-body text-xs font-semibold text-joven">{errores.habilidades}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectorMunicipio
            value={f.municipio_id}
            onChange={(e) => set('municipio_id', e.target.value)}
            placeholder="Municipio"
          />
          <Campo
            etiqueta="Cupos"
            type="number"
            min="1"
            value={f.cupos}
            onChange={(e) => set('cupos', e.target.value)}
            placeholder="4"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo
            etiqueta="Desde"
            type="date"
            value={f.fecha_inicio}
            onChange={(e) => set('fecha_inicio', e.target.value)}
          />
          <Campo
            etiqueta="Hasta"
            type="date"
            value={f.fecha_fin}
            onChange={(e) => set('fecha_fin', e.target.value)}
            error={errores.fecha_fin}
          />
        </div>

        <Campo
          etiqueta="Cierre de postulaciones"
          type="date"
          value={f.fecha_cierre}
          onChange={(e) => set('fecha_cierre', e.target.value)}
          ayuda="Opcional. Hasta cuándo se reciben postulaciones."
        />

        <Campo
          etiqueta="Pago estimado"
          icono="💵"
          value={f.pago_estimado}
          onChange={(e) => set('pago_estimado', e.target.value)}
          placeholder="$ 60.000 / día"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      <Boton variante="joven" className="mt-6" cargando={enviando} onClick={enviar}>
        Publicar pop-up
      </Boton>
      <p className="mt-3 text-center font-body text-xs text-tenue">
        Un líder de área lo aprueba antes de que sea visible. 🔎
      </p>
    </div>
  )
}
