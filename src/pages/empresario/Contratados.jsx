import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { Cargando } from '../../components/Cargando.jsx'
import { TarjetaContratacion } from '../../components/TarjetaContratacion.jsx'
import { getMiEmpresa } from '../../lib/popups.js'
import { listarContratacionesEmpresa, registrarSeguimiento } from '../../lib/contrataciones.js'

/** Seguimiento de las personas contratadas por la empresa del empresario. */
export function Contratados() {
  const { usuario } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ocupado, setOcupado] = useState(null)

  const cargar = useCallback(async () => {
    const empresa = await getMiEmpresa(usuario.id)
    if (!empresa) return setItems([])
    setItems(await listarContratacionesEmpresa(empresa.id))
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    cargar()
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [usuario, cargar])

  async function seguimiento(c, sigueVinculado) {
    if (
      !sigueVinculado &&
      !window.confirm(`¿Confirmas que ${c.joven} ya no está vinculado(a) a tu empresa?`)
    )
      return
    setOcupado(c.id)
    setError(null)
    try {
      await registrarSeguimiento(c.id, { sigueVinculado })
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  async function reactivar(c) {
    setOcupado(c.id)
    setError(null)
    try {
      await registrarSeguimiento(c.id, { sigueVinculado: true })
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(null)
    }
  }

  if (cargando) return <Cargando />

  const activos = items.filter((c) => c.activo)
  const finalizados = items.filter((c) => !c.activo)

  return (
    <div className="py-2">
      <h1 className="font-display text-2xl font-bold text-tinta">Contratados</h1>
      <p className="mb-4 mt-1 font-body text-sm text-tenue">
        Lleva el seguimiento de las personas que contrataste. Confirmar cómo van ayuda a medir el
        impacto del programa.
      </p>

      {error && (
        <p className="mb-3 rounded-xl bg-joven/10 px-3 py-2 font-body text-[13px] font-semibold text-joven">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borde bg-white/60 px-4 py-10 text-center">
          <p className="font-body text-sm text-tenue">
            Aún no has contratado a nadie. Cuando marques a una persona como contratada en un
            pop-up, aparecerá aquí.
          </p>
          <Link to="/empresario/popups" className="mt-3 inline-block font-body text-sm font-bold text-empresario">
            Ver mis pop-ups
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {activos.map((c) => (
              <TarjetaContratacion
                key={c.id}
                c={c}
                onSeguimiento={seguimiento}
                ocupado={ocupado === c.id}
              />
            ))}
          </div>
          {finalizados.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 font-display text-lg font-bold text-tinta">Finalizados</h2>
              <div className="space-y-3">
                {finalizados.map((c) => (
                  <TarjetaContratacion
                    key={c.id}
                    c={c}
                    onReactivar={reactivar}
                    ocupado={ocupado === c.id}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
