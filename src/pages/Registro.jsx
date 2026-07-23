import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '../layouts/AuthShell.jsx'
import { BarraPasos } from '../components/ui/BarraPasos.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { Selector } from '../components/ui/Selector.jsx'
import { Casilla } from '../components/ui/Casilla.jsx'
import { Boton } from '../components/ui/Boton.jsx'
import { useMunicipios } from '../hooks/useMunicipios.js'
import { registrarUsuario } from '../lib/auth.js'
import { ROLES } from '../constants/roles.js'
import { calcularEdad, esMenorDeEdad, validarEdadJoven } from '../lib/edad.js'

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function Registro() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { municipios } = useMunicipios()

  const rol = params.get('rol') === ROLES.EMPRESARIO ? ROLES.EMPRESARIO : ROLES.JOVEN
  const esJoven = rol === ROLES.JOVEN
  const acento = esJoven ? 'joven' : 'empresario'

  const [paso, setPaso] = useState(1)
  const [verPass, setVerPass] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [errores, setErrores] = useState({})

  const [f, setF] = useState({
    nombre: '',
    email: '',
    password: '',
    municipioId: '',
    fechaNacimiento: '',
    nombreEmpresa: '',
    nit: '',
    sector: '',
    autorizacionDatos: false,
    autorizacionAcudiente: false,
  })
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))

  const opcionesMunicipio = useMemo(
    () => municipios.map((m) => ({ value: m.id, label: m.nombre })),
    [municipios],
  )

  const edad = esJoven ? calcularEdad(f.fechaNacimiento) : null
  const menor = esJoven && esMenorDeEdad(edad)

  function validarPaso1() {
    const e = {}
    if (!f.nombre.trim()) e.nombre = 'Ingresa tu nombre.'
    if (!emailValido(f.email)) e.email = 'Correo no válido.'
    if (f.password.length < 8) e.password = 'Mínimo 8 caracteres.'
    if (esJoven && !f.municipioId) e.municipioId = 'Selecciona tu municipio.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function validarPaso2() {
    const e = {}
    if (esJoven) {
      const errEdad = validarEdadJoven(f.fechaNacimiento)
      if (errEdad) e.fechaNacimiento = errEdad
      if (menor && !f.autorizacionAcudiente)
        e.autorizacionAcudiente = 'Se requiere la autorización del acudiente.'
    } else {
      if (!f.nombreEmpresa.trim()) e.nombreEmpresa = 'Ingresa el nombre de la empresa.'
      if (!f.municipioId) e.municipioId = 'Selecciona el municipio de la empresa.'
    }
    if (!f.autorizacionDatos)
      e.autorizacionDatos = 'Debes autorizar el tratamiento de datos para continuar.'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function continuar() {
    setErrorGeneral(null)
    if (validarPaso1()) setPaso(2)
  }

  async function enviar() {
    setErrorGeneral(null)
    if (!validarPaso2()) return
    setEnviando(true)
    try {
      const metadata = esJoven
        ? {
            rol: ROLES.JOVEN,
            nombre: f.nombre.trim(),
            municipio_id: f.municipioId,
            autorizacion_datos: true,
            es_menor_edad: menor,
            autorizacion_acudiente: menor ? true : false,
          }
        : {
            rol: ROLES.EMPRESARIO,
            nombre: f.nombre.trim(),
            municipio_id: f.municipioId,
            autorizacion_datos: true,
            nombre_empresa: f.nombreEmpresa.trim(),
            nit: f.nit.trim(),
            sector: f.sector.trim(),
          }
      const { necesitaConfirmacion } = await registrarUsuario({
        email: f.email.trim(),
        password: f.password,
        metadata,
      })
      if (necesitaConfirmacion) navigate('/confirmar-correo', { state: { email: f.email.trim() } })
      else navigate('/onboarding', { replace: true })
    } catch (err) {
      setErrorGeneral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const badge = esJoven ? '🌱 Cuenta de joven' : '💼 Cuenta de empresario'
  const badgeClase = esJoven
    ? 'bg-lima/30 text-[#5d6c17] border-lima/50'
    : 'bg-empresario/10 text-empresario border-empresario/30'

  return (
    <AuthShell acento={acento}>
      <BarraPasos
        paso={paso}
        total={2}
        acento={acento}
        onAtras={paso === 2 ? () => setPaso(1) : undefined}
        volverA="/"
      />

      <div className="pt-3">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-body text-[12.5px] font-bold ${badgeClase}`}>
          {badge}
        </span>

        {paso === 1 ? (
          <>
            <h1 className="mt-4 font-display text-[27px] font-bold leading-tight text-tinta">
              Crea tu cuenta
            </h1>
            <p className="mb-5 mt-1 font-body text-[14.5px] text-tenue">
              {esJoven ? 'Solo necesitas un correo. Es rápido y gratis.' : 'Registra tus datos de contacto.'}
            </p>

            <div className="space-y-4">
              <Campo
                id="nombre"
                etiqueta={esJoven ? 'Nombre completo' : 'Nombre de contacto'}
                icono="👤"
                value={f.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                error={errores.nombre}
                placeholder={esJoven ? 'Laura Marín' : 'Tu nombre'}
              />
              <Campo
                id="email"
                etiqueta="Correo electrónico"
                icono="✉️"
                type="email"
                autoComplete="email"
                value={f.email}
                onChange={(e) => set('email', e.target.value)}
                error={errores.email}
                placeholder="tucorreo@ejemplo.com"
              />
              <Campo
                id="password"
                etiqueta="Contraseña"
                icono="🔒"
                type={verPass ? 'text' : 'password'}
                autoComplete="new-password"
                value={f.password}
                onChange={(e) => set('password', e.target.value)}
                error={errores.password}
                ayuda="Mínimo 8 caracteres."
                placeholder="••••••••"
                sufijo={
                  <button
                    type="button"
                    onClick={() => setVerPass((v) => !v)}
                    className="font-body text-[13px] font-bold text-empresario"
                  >
                    {verPass ? 'Ocultar' : 'Ver'}
                  </button>
                }
              />
              {esJoven && (
                <Selector
                  id="municipio"
                  etiqueta="Municipio"
                  icono="📍"
                  opciones={opcionesMunicipio}
                  value={f.municipioId}
                  onChange={(e) => set('municipioId', e.target.value)}
                  error={errores.municipioId}
                  placeholder="Selecciona tu municipio"
                />
              )}
            </div>

            <Boton variante={acento} className="mt-6" onClick={continuar}>
              Continuar →
            </Boton>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-[27px] font-bold leading-tight text-tinta">
              {esJoven ? 'Un último paso' : 'Tu empresa'}
            </h1>
            <p className="mb-5 mt-1 font-body text-[14.5px] text-tenue">
              {esJoven
                ? 'Necesitamos tu edad y tu autorización de datos.'
                : 'Cuéntanos de la empresa que representas.'}
            </p>

            <div className="space-y-4">
              {esJoven ? (
                <>
                  <Campo
                    id="nacimiento"
                    etiqueta="Fecha de nacimiento"
                    icono="🎂"
                    type="date"
                    value={f.fechaNacimiento}
                    onChange={(e) => set('fechaNacimiento', e.target.value)}
                    error={errores.fechaNacimiento}
                    ayuda={
                      edad !== null && !errores.fechaNacimiento ? `Tienes ${edad} años.` : undefined
                    }
                  />
                  {menor && (
                    <div className="rounded-2xl border border-naranja/40 bg-naranja/10 p-4">
                      <p className="mb-2 font-body text-[13px] font-bold text-tinta">
                        Eres menor de edad (16–17)
                      </p>
                      <Casilla
                        id="acudiente"
                        acento={acento}
                        checked={f.autorizacionAcudiente}
                        onChange={(v) => set('autorizacionAcudiente', v)}
                        error={errores.autorizacionAcudiente}
                      >
                        Mi acudiente o representante legal autoriza mi registro y el
                        tratamiento de mis datos personales.
                      </Casilla>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Campo
                    id="empresa"
                    etiqueta="Nombre de la empresa"
                    icono="🏢"
                    value={f.nombreEmpresa}
                    onChange={(e) => set('nombreEmpresa', e.target.value)}
                    error={errores.nombreEmpresa}
                    placeholder="Café de la Montaña S.A.S."
                  />
                  <Campo
                    id="nit"
                    etiqueta="NIT (opcional)"
                    icono="🧾"
                    value={f.nit}
                    onChange={(e) => set('nit', e.target.value)}
                    placeholder="900.123.456-7"
                  />
                  <Campo
                    id="sector"
                    etiqueta="Sector (opcional)"
                    icono="🏭"
                    value={f.sector}
                    onChange={(e) => set('sector', e.target.value)}
                    placeholder="Turismo, agroindustria…"
                  />
                  <Selector
                    id="municipio"
                    etiqueta="Municipio"
                    icono="📍"
                    opciones={opcionesMunicipio}
                    value={f.municipioId}
                    onChange={(e) => set('municipioId', e.target.value)}
                    error={errores.municipioId}
                    placeholder="Municipio de la empresa"
                  />
                </>
              )}

              <div className="rounded-2xl border border-borde bg-white p-4">
                <Casilla
                  id="datos"
                  acento={acento}
                  checked={f.autorizacionDatos}
                  onChange={(v) => set('autorizacionDatos', v)}
                  error={errores.autorizacionDatos}
                >
                  Acepto los{' '}
                  <Link to="/terminos" className="font-bold text-tinta underline">
                    términos
                  </Link>{' '}
                  y autorizo el{' '}
                  <Link to="/privacidad" className="font-bold text-tinta underline">
                    tratamiento de mis datos
                  </Link>{' '}
                  (Ley 1581 de 2012).
                </Casilla>
              </div>
            </div>

            {errorGeneral && (
              <p className="mt-4 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
                {errorGeneral}
              </p>
            )}

            <Boton variante={acento} className="mt-6" cargando={enviando} onClick={enviar}>
              Crear cuenta
            </Boton>
          </>
        )}

        <p className="mt-5 text-center font-body text-[13.5px] text-tenue">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-empresario">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
