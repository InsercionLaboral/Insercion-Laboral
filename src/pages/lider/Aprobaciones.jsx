import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { rangoFechas } from '../../lib/fechas.js'
import {
  listarPerfilesPendientes,
  listarPopupsPendientes,
  revisarPerfil,
  revisarPopup,
} from '../../lib/aprobaciones.js'

export function Aprobaciones() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState('perfiles')
  const [perfiles, setPerfiles] = useState([])
  const [popups, setPopups] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(null)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const cargar = useCallback(async () => {
    const [p, pu] = await Promise.all([listarPerfilesPendientes(), listarPopupsPendientes()])
    setPerfiles(p)
    setPopups(pu)
  }, [])

  useEffect(() => {
    cargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cargar])

  async function decidirPerfil(perfil, aprobado) {
    setOcupado(perfil.id)
    setError(null)
    try {
      await revisarPerfil({ perfilId: perfil.id, aprobado, revisorId: usuario.id })
      setPerfiles((prev) => prev.filter((x) => x.id !== perfil.id))
      setAviso(`Perfil de ${perfil.nombre} ${aprobado ? 'aprobado' : 'rechazado'}.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  async function decidirPopup(popup, aprobado) {
    setOcupado(popup.id)
    setError(null)
    try {
      await revisarPopup({ popupId: popup.id, aprobado, revisorId: usuario.id })
      setPopups((prev) => prev.filter((x) => x.id !== popup.id))
      setAviso(`Pop-up "${popup.titulo}" ${aprobado ? 'aprobado y publicado' : 'rechazado'}.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <p className="font-body text-xs text-tenue">Pendiente de revisión</p>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-tinta">Aprobaciones</h1>
        <Link to="/lider/auditoria" className="font-body text-[13px] font-bold text-empresario">
          Historial
        </Link>
      </div>

      {/* Pestañas */}
      <div className="mb-4 flex gap-2.5">
        <BotonTab activo={tab === 'perfiles'} onClick={() => setTab('perfiles')}>
          Perfiles · {perfiles.length}
        </BotonTab>
        <BotonTab activo={tab === 'popups'} onClick={() => setTab('popups')}>
          Pop-ups · {popups.length}
        </BotonTab>
      </div>

      {aviso && (
        <p className="mb-3 rounded-xl bg-lima/30 px-3 py-2 font-body text-[13px] font-semibold text-[#5d6c17]">
          {aviso}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {tab === 'perfiles' ? (
        perfiles.length === 0 ? (
          <Vacio texto="No hay perfiles esperando revisión. ¡Todo al día! 🎉" />
        ) : (
          <div className="space-y-3">
            {perfiles.map((p) => (
              <div key={p.id} className="rounded-2xl border border-borde bg-white p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar nombre={p.nombre} fotoUrl={p.fotoUrl} className="size-13" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-semibold text-tinta">
                      {p.nombre}
                    </p>
                    <p className="font-body text-xs text-tenue">📍 {p.municipio ?? '—'}</p>
                  </div>
                  <span className="rounded-full bg-naranja/15 px-2.5 py-1 font-body text-[11px] font-bold text-[#B96C00]">
                    Perfil
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2 font-body text-[11.5px] font-bold">
                  <span className="rounded-full bg-fondo px-2.5 py-1 text-tenue">
                    {p.habilidades.length} habilidades
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 ${p.fotoUrl ? 'bg-lima/30 text-[#5d6c17]' : 'bg-joven/10 text-joven'}`}
                  >
                    {p.fotoUrl ? 'Foto ✓' : 'Sin foto'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 ${p.presentacion ? 'bg-fondo text-tenue' : 'bg-joven/10 text-joven'}`}
                  >
                    {p.presentacion ? 'Con presentación' : 'Sin presentación'}
                  </span>
                </div>

                <Acciones
                  verA={`/lider/perfil/${p.usuarioId}`}
                  ocupado={ocupado === p.id}
                  onRechazar={() => decidirPerfil(p, false)}
                  onAprobar={() => decidirPerfil(p, true)}
                />
              </div>
            ))}
          </div>
        )
      ) : popups.length === 0 ? (
        <Vacio texto="No hay pop-ups esperando aprobación." />
      ) : (
        <div className="space-y-3">
          {popups.map((p) => (
            <div key={p.id} className="rounded-2xl border border-borde bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-naranja/15 text-2xl">
                  ⚡
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[14.5px] font-semibold leading-tight text-tinta">
                    {p.titulo}
                  </p>
                  <p className="font-body text-xs text-tenue">
                    {p.empresa} {p.municipio ? `· ${p.municipio}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-joven/10 px-2.5 py-1 font-body text-[11px] font-bold text-[#B0075E]">
                  Pop-up
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 font-body text-[11.5px] font-bold text-tenue">
                {p.cupos != null && (
                  <span className="rounded-full bg-fondo px-2.5 py-1">{p.cupos} cupos</span>
                )}
                {p.pago_estimado && (
                  <span className="rounded-full bg-fondo px-2.5 py-1">{p.pago_estimado}</span>
                )}
                {rangoFechas(p.fecha_inicio, p.fecha_fin) && (
                  <span className="rounded-full bg-fondo px-2.5 py-1">
                    📅 {rangoFechas(p.fecha_inicio, p.fecha_fin)}
                  </span>
                )}
              </div>

              {p.habilidades.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {p.habilidades.map((h, i) => (
                    <Chip key={h.id} indice={i}>
                      {h.nombre}
                    </Chip>
                  ))}
                </div>
              )}

              <Acciones
                verA={`/lider/popup/${p.id}`}
                ocupado={ocupado === p.id}
                onRechazar={() => decidirPopup(p, false)}
                onAprobar={() => decidirPopup(p, true)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BotonTab({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2.5 font-display text-[13.5px] font-semibold transition ${
        activo ? 'bg-lima text-tinta' : 'border border-borde bg-white text-tenue'
      }`}
    >
      {children}
    </button>
  )
}

function Acciones({ verA, ocupado, onRechazar, onAprobar }) {
  return (
    <div className="flex gap-2.5">
      <Link
        to={verA}
        className="flex-1 rounded-xl border border-borde bg-white py-2.5 text-center font-body text-[13.5px] font-bold text-tinta"
      >
        Ver
      </Link>
      <button
        onClick={onRechazar}
        disabled={ocupado}
        className="flex-1 rounded-xl border border-[#F1B5B5] bg-white py-2.5 font-body text-[13.5px] font-bold text-[#C23B3B] disabled:opacity-50"
      >
        Rechazar
      </button>
      <button
        onClick={onAprobar}
        disabled={ocupado}
        className="flex-[1.4] rounded-xl bg-[#2FB863] py-2.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-50"
      >
        ✓ Aprobar
      </button>
    </div>
  )
}

function Vacio({ texto }) {
  return (
    <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
      <p className="font-body text-sm text-tenue">{texto}</p>
    </div>
  )
}
