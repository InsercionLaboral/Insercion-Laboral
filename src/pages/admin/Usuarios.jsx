import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { restablecerContrasenaDe } from '../../lib/cuenta.js'
import {
  ETIQUETA_ROL,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  listarUsuarios,
} from '../../lib/usuarios.js'

const ROLES = Object.keys(ETIQUETA_ROL)

/** Administración de usuarios: buscar, activar/desactivar y cambiar el rol. */
export function Usuarios() {
  const { usuario: yo } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [rol, setRol] = useState('todos')
  const [ocupado, setOcupado] = useState(null)
  const [clavePara, setClavePara] = useState(null) // usuario al que se le pone contraseña
  const [claveNueva, setClaveNueva] = useState('')
  const [errorClave, setErrorClave] = useState(null)

  const cargar = useCallback(async () => setUsuarios(await listarUsuarios()), [])

  useEffect(() => {
    cargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [cargar])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter((u) => {
      if (rol !== 'todos' && u.rol !== rol) return false
      return !q || [u.nombre, u.email, u.municipio].some((v) => v?.toLowerCase().includes(q))
    })
  }, [usuarios, busqueda, rol])

  async function alternarEstado(u) {
    const nuevo = u.estado === 'inactivo' ? 'activo' : 'inactivo'
    if (nuevo === 'inactivo' && !window.confirm(`¿Desactivar la cuenta de ${u.nombre}? No podrá iniciar sesión.`)) return
    setOcupado(u.id)
    setError(null)
    setAviso(null)
    try {
      await cambiarEstadoUsuario(u.id, nuevo)
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, estado: nuevo } : x)))
      setAviso(`Cuenta de ${u.nombre} ${nuevo === 'activo' ? 'activada' : 'desactivada'}.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  async function cambiarRol(u, nuevoRol) {
    if (nuevoRol === u.rol) return
    if (!window.confirm(`¿Cambiar el rol de ${u.nombre} a "${ETIQUETA_ROL[nuevoRol]}"?`)) return
    setOcupado(u.id)
    setError(null)
    setAviso(null)
    try {
      await cambiarRolUsuario(u.id, nuevoRol)
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol: nuevoRol } : x)))
      setAviso(`${u.nombre} ahora es ${ETIQUETA_ROL[nuevoRol]}.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  async function guardarClave() {
    setErrorClave(null)
    if (claveNueva.length < 8) return setErrorClave('Mínimo 8 caracteres.')
    setOcupado(clavePara.id)
    try {
      await restablecerContrasenaDe(clavePara.id, claveNueva)
      setAviso(`Listo. La nueva contraseña de ${clavePara.nombre} es la que escribiste: compártela con esa persona por un medio privado.`)
      setClavePara(null)
      setClaveNueva('')
    } catch (e) {
      setErrorClave(e.message)
    } finally {
      setOcupado(null)
    }
  }

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Usuarios</h1>
      <p className="mb-4 mt-1 font-body text-sm text-tenue">
        {usuarios.length} cuentas registradas. Desde aquí puedes desactivar una cuenta o cambiar su rol
        (por ejemplo, para nombrar a una nueva líder de área).
      </p>

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, correo o municipio"
        aria-label="Buscar usuarios"
        className="mb-3 w-full rounded-2xl border border-borde bg-white px-4 py-3 font-body text-[14px] text-tinta outline-none"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {['todos', ...ROLES].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRol(r)}
            className={`rounded-full px-3.5 py-1.5 font-body text-[12.5px] font-bold ${
              rol === r ? 'bg-tinta text-white' : 'border border-borde bg-white text-tenue'
            }`}
          >
            {r === 'todos' ? 'Todos' : ETIQUETA_ROL[r]}
          </button>
        ))}
      </div>

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

      <div className="space-y-2.5">
        {visibles.map((u) => {
          const esYo = u.id === yo?.id
          const inactivo = u.estado === 'inactivo'
          return (
            <div key={u.id} className={`rounded-2xl border border-borde bg-white p-3.5 ${inactivo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold text-tinta">
                    {u.nombre} {esYo && <span className="font-body text-xs text-tenue">(tú)</span>}
                  </p>
                  <p className="truncate font-body text-xs text-tenue">{u.email}</p>
                  {u.municipio && <p className="font-body text-xs text-tenue">📍 {u.municipio}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[11.5px] font-bold ${
                    inactivo ? 'bg-borde text-tenue' : 'bg-[#2FB863]/15 text-[#1c7d42]'
                  }`}
                >
                  {inactivo ? 'Desactivada' : 'Activa'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={u.rol}
                  disabled={esYo || ocupado === u.id}
                  onChange={(e) => cambiarRol(u, e.target.value)}
                  aria-label={`Rol de ${u.nombre}`}
                  className="rounded-full border border-borde bg-white px-3 py-1.5 font-body text-[12.5px] font-bold text-tinta disabled:opacity-60"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ETIQUETA_ROL[r]}
                    </option>
                  ))}
                </select>
                {!esYo && (
                  <button
                    type="button"
                    disabled={ocupado === u.id}
                    onClick={() => {
                      setClavePara(u)
                      setClaveNueva('')
                      setErrorClave(null)
                    }}
                    className="rounded-full border border-borde px-3.5 py-1.5 font-body text-[12.5px] font-bold text-tinta disabled:opacity-50"
                  >
                    Restablecer contraseña
                  </button>
                )}
                {!esYo && (
                  <button
                    type="button"
                    disabled={ocupado === u.id}
                    onClick={() => alternarEstado(u)}
                    className="rounded-full border border-borde px-3.5 py-1.5 font-body text-[12.5px] font-bold text-tinta disabled:opacity-50"
                  >
                    {inactivo ? 'Activar cuenta' : 'Desactivar cuenta'}
                  </button>
                )}
              </div>
              {clavePara?.id === u.id && (
                <div className="mt-3 rounded-2xl bg-fondo p-3">
                  <label htmlFor={`clave-${u.id}`} className="mb-1.5 block font-body text-[12.5px] font-bold text-tinta">
                    Contraseña nueva para {u.nombre}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      id={`clave-${u.id}`}
                      type="text"
                      value={claveNueva}
                      onChange={(e) => setClaveNueva(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="min-w-0 flex-1 rounded-xl border border-borde bg-white px-3 py-2 font-body text-[13.5px] text-tinta outline-none"
                    />
                    <button
                      type="button"
                      onClick={guardarClave}
                      disabled={ocupado === u.id}
                      className="rounded-xl bg-tinta px-3.5 py-2 font-body text-[12.5px] font-bold text-white disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setClavePara(null)}
                      className="rounded-xl px-2 py-2 font-body text-[12.5px] font-bold text-tenue"
                    >
                      Cancelar
                    </button>
                  </div>
                  {errorClave && <p className="mt-1.5 font-body text-xs font-semibold text-joven">{errorClave}</p>}
                </div>
              )}
            </div>
          )
        })}
        {visibles.length === 0 && (
          <p className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-8 text-center font-body text-sm text-tenue">
            No se encontraron usuarios.
          </p>
        )}
      </div>
    </div>
  )
}
