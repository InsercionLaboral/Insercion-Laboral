import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider.jsx'
import { Cargando } from '../components/Cargando.jsx'
import { SelectorMunicipio } from '../components/SelectorMunicipio.jsx'
import { Boton } from '../components/ui/Boton.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { ROLES } from '../constants/roles.js'
import { actualizarMiEmpresa, actualizarMisDatos, cambiarContrasena } from '../lib/cuenta.js'
import { getMiEmpresa } from '../lib/popups.js'
import { ETIQUETA_ROL } from '../lib/usuarios.js'

/** Mi cuenta: datos personales, datos de la empresa (empresario) y contraseña. */
export function MiCuenta() {
  const { usuario, session, refrescarUsuario } = useAuth()
  const esEmpresario = usuario?.rol === ROLES.EMPRESARIO
  const usaMunicipio = [ROLES.JOVEN, ROLES.EMPRESARIO].includes(usuario?.rol)

  const [cargando, setCargando] = useState(true)
  const [datos, setDatos] = useState({ nombre: '', municipioId: '' })
  const [empresa, setEmpresa] = useState(null)
  const [emp, setEmp] = useState({ nombreEmpresa: '', nit: '', sector: '', municipioId: '' })
  const [clave, setClave] = useState({ nueva: '', repetir: '' })
  const [ver, setVer] = useState(false)
  const [msg, setMsg] = useState({})
  const [ocupado, setOcupado] = useState(null)

  useEffect(() => {
    if (!usuario) return
    setDatos({ nombre: usuario.nombre ?? '', municipioId: usuario.municipio_id ?? '' })
    if (!esEmpresario) return setCargando(false)
    getMiEmpresa(usuario.id)
      .then((e) => {
        setEmpresa(e)
        if (e)
          setEmp({
            nombreEmpresa: e.nombre_empresa ?? '',
            nit: e.nit ?? '',
            sector: e.sector ?? '',
            municipioId: e.municipio_id ?? '',
          })
      })
      .finally(() => setCargando(false))
  }, [usuario, esEmpresario])

  async function accion(clave_, fn, ok) {
    setOcupado(clave_)
    setMsg({})
    try {
      await fn()
      setMsg({ [clave_]: { ok } })
    } catch (e) {
      setMsg({ [clave_]: { error: e.message } })
    } finally {
      setOcupado(null)
    }
  }

  const guardarDatos = () =>
    accion('datos', async () => {
      await actualizarMisDatos(usuario.id, datos)
      await refrescarUsuario()
    }, 'Tus datos quedaron guardados.')

  const guardarEmpresa = () =>
    accion('empresa', () => actualizarMiEmpresa(empresa.id, emp), 'Los datos de la empresa quedaron guardados.')

  const guardarClave = () =>
    accion('clave', async () => {
      if (clave.nueva !== clave.repetir) throw new Error('Las dos contraseñas no coinciden.')
      await cambiarContrasena(clave.nueva)
      setClave({ nueva: '', repetir: '' })
    }, 'Tu contraseña cambió. Úsala la próxima vez que entres.')

  if (cargando) return <Cargando />

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Mi cuenta</h1>
      <p className="mb-5 mt-1 font-body text-sm text-tenue">
        {session?.user?.email} · {ETIQUETA_ROL[usuario?.rol] ?? ''}
      </p>

      <Seccion titulo="Tus datos">
        <Campo id="cuenta-nombre" etiqueta="Nombre completo" value={datos.nombre} onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))} />
        {usaMunicipio && (
          <SelectorMunicipio value={datos.municipioId} onChange={(e) => setDatos((d) => ({ ...d, municipioId: e.target.value }))} />
        )}
        <Mensaje m={msg.datos} />
        <Boton variante="tinta" cargando={ocupado === 'datos'} onClick={guardarDatos}>
          Guardar mis datos
        </Boton>
      </Seccion>

      {esEmpresario && empresa && (
        <Seccion titulo="Tu empresa">
          <Campo id="cuenta-empresa" etiqueta="Nombre de la empresa" value={emp.nombreEmpresa} onChange={(e) => setEmp((d) => ({ ...d, nombreEmpresa: e.target.value }))} />
          <Campo id="cuenta-nit" etiqueta="NIT (opcional)" value={emp.nit} onChange={(e) => setEmp((d) => ({ ...d, nit: e.target.value }))} />
          <Campo id="cuenta-sector" etiqueta="Sector (opcional)" value={emp.sector} onChange={(e) => setEmp((d) => ({ ...d, sector: e.target.value }))} />
          <div>
            <p className="mb-1.5 font-body text-[13.5px] font-bold text-tinta">Municipio de la empresa</p>
            <SelectorMunicipio etiqueta={null} id="cuenta-municipio-empresa" value={emp.municipioId} onChange={(e) => setEmp((d) => ({ ...d, municipioId: e.target.value }))} />
          </div>
          <Mensaje m={msg.empresa} />
          <Boton variante="tinta" cargando={ocupado === 'empresa'} onClick={guardarEmpresa}>
            Guardar datos de la empresa
          </Boton>
        </Seccion>
      )}

      <Seccion titulo="Cambiar contraseña">
        <Campo
          id="cuenta-clave"
          etiqueta="Contraseña nueva"
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          value={clave.nueva}
          onChange={(e) => setClave((c) => ({ ...c, nueva: e.target.value }))}
          ayuda="Mínimo 8 caracteres."
          sufijo={
            <button type="button" onClick={() => setVer((v) => !v)} className="font-body text-[13px] font-bold text-empresario">
              {ver ? 'Ocultar' : 'Ver'}
            </button>
          }
        />
        <Campo
          id="cuenta-clave-2"
          etiqueta="Repite la contraseña nueva"
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          value={clave.repetir}
          onChange={(e) => setClave((c) => ({ ...c, repetir: e.target.value }))}
        />
        <Mensaje m={msg.clave} />
        <Boton variante="tinta" cargando={ocupado === 'clave'} onClick={guardarClave}>
          Cambiar contraseña
        </Boton>
      </Seccion>

      <p className="mt-2 font-body text-xs text-tenue">
        ¿Quieres borrar tu cuenta o tus datos? Escríbele al equipo de Inserción Laboral del Comité de Cafeteros de Caldas.
      </p>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <section className="mb-5 space-y-3.5 rounded-3xl border border-borde bg-superficie p-4">
      <h2 className="font-display text-lg font-bold text-tinta">{titulo}</h2>
      {children}
    </section>
  )
}

function Mensaje({ m }) {
  if (!m) return null
  return m.error ? (
    <p className="rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">{m.error}</p>
  ) : (
    <p className="rounded-xl bg-lima/30 px-3 py-2 font-body text-[13px] font-semibold text-[#5d6c17]">{m.ok}</p>
  )
}
