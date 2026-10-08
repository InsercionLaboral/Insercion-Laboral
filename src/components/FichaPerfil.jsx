import { Avatar } from './ui/Avatar.jsx'
import { Chip } from './ui/Chip.jsx'
import { construirEnlaceWa } from '../lib/whatsapp.js'
import { enlaceSeguro } from '../lib/proyectos.js'

const ETIQUETA_ESTADO = {
  borrador: { texto: 'Borrador', clase: 'bg-borde text-tenue' },
  en_revision: { texto: 'En revisión', clase: 'bg-naranja/20 text-[#B96C00]' },
  aprobado: { texto: '✓ Perfil verificado', clase: 'bg-tinta text-lima' },
  rechazado: { texto: 'Necesita cambios', clase: 'bg-joven/15 text-joven' },
}

/**
 * Ficha pública del portafolio del joven. Presentacional: recibe el objeto
 * `perfil` (de obtener_perfil_publico). `vistaEmpresario` muestra el banner de
 * contexto y el CTA de contacto por WhatsApp.
 */
export function FichaPerfil({ perfil, proyectos = [], vistaEmpresario = false }) {
  const habilidades = Array.isArray(perfil.habilidades) ? perfil.habilidades : []
  const estado = ETIQUETA_ESTADO[perfil.estado_revision] ?? ETIQUETA_ESTADO.borrador
  const enlaceWa = construirEnlaceWa(
    perfil.telefono,
    `¡Hola ${perfil.nombre?.split(' ')[0] ?? ''}! Vi tu perfil en Inserción Laboral y me gustaría contactarte.`,
  )

  return (
    <div className="overflow-hidden rounded-3xl border border-borde bg-superficie">
      {vistaEmpresario && (
        <div className="flex items-center gap-2 bg-tinta px-5 py-2 font-body text-xs font-bold text-white">
          <span className="size-1.5 rounded-full bg-empresario" />
          Estás viendo un perfil · vista empresario
        </div>
      )}

      {/* Hero */}
      <div className="bg-lima px-5 pb-6 pt-5">
        <div className="flex items-center gap-4">
          <Avatar
            nombre={perfil.nombre}
            fotoUrl={perfil.foto_url}
            className="size-20 border-2 border-white"
            texto="text-2xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold text-tinta">{perfil.nombre}</h1>
            {perfil.municipio && (
              <p className="mt-0.5 font-body text-[13.5px] font-bold text-[#3f4326]">
                📍 {perfil.municipio}
              </p>
            )}
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11.5px] font-bold ${estado.clase}`}
            >
              {estado.texto}
            </span>
          </div>
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="-mt-3 mx-5 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-md shadow-tinta/10">
        <span
          className={`size-2.5 rounded-full ${perfil.disponible ? 'bg-[#2FB863] ring-4 ring-[#2FB863]/20' : 'bg-tenue'}`}
        />
        <span className="font-body text-sm font-bold text-tinta">
          {perfil.disponible ? 'Disponible para pop-ups' : 'No disponible por ahora'}
        </span>
      </div>

      <div className="px-5 py-5">
        {perfil.presentacion && (
          <section className="mb-5">
            <h2 className="mb-1.5 font-display text-[15px] font-semibold text-tinta">Sobre mí</h2>
            <p className="font-body text-[14px] leading-relaxed text-[#3f4133]">
              {perfil.presentacion}
            </p>
          </section>
        )}

        {habilidades.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2.5 font-display text-[15px] font-semibold text-tinta">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {habilidades.map((h, i) => (
                <Chip key={h.id} indice={i}>
                  {h.nombre}
                </Chip>
              ))}
            </div>
          </section>
        )}

        {proyectos.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2.5 font-display text-[15px] font-semibold text-tinta">
              Proyectos destacados
            </h2>
            <div className="space-y-2.5">
              {proyectos.map((pr) => {
                const enlace = enlaceSeguro(pr.enlace)
                return (
                  <div key={pr.id} className="flex items-start gap-3 rounded-2xl border border-borde bg-white p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-naranja/15 text-xl">
                      ⭐
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[14.5px] font-semibold leading-snug text-tinta">
                        {pr.titulo}
                      </p>
                      {pr.descripcion && (
                        <p className="mt-1 font-body text-[13.5px] leading-snug text-[#3f4133]">
                          {pr.descripcion}
                        </p>
                      )}
                      {enlace && (
                        <a
                          href={enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-block font-body text-[12.5px] font-bold text-empresario"
                        >
                          Ver proyecto ↗
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {perfil.formacion && (
          <section className="mb-1">
            <h2 className="mb-2.5 font-display text-[15px] font-semibold text-tinta">
              Formación técnica
            </h2>
            <div className="flex items-start gap-3 rounded-2xl border border-borde bg-white p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lima/40 text-xl">
                🎓
              </span>
              <p className="font-body text-[14px] leading-snug text-tinta">{perfil.formacion}</p>
            </div>
          </section>
        )}
      </div>

      {vistaEmpresario && (
        <div className="flex gap-3 border-t border-borde bg-white px-5 py-4">
          {enlaceWa ? (
            <a
              href={enlaceWa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-joven px-5 py-3.5 font-display font-semibold text-white shadow-lg shadow-joven/40"
            >
              💬 Contactar por WhatsApp
            </a>
          ) : (
            <p className="flex-1 rounded-2xl bg-fondo px-4 py-3 text-center font-body text-[13px] text-tenue">
              Esta persona aún no registró un número de contacto.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
