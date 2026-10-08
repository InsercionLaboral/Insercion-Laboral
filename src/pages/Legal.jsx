import { Link, useNavigate } from 'react-router-dom'
import { CORREO_CONTACTO, TEXTOS_LEGALES_VALIDADOS } from '../config.js'
import { EDAD_MAXIMA, EDAD_MINIMA } from '../lib/edad.js'

function Contacto() {
  return CORREO_CONTACTO ? (
    <a href={`mailto:${CORREO_CONTACTO}`} className="font-bold text-empresario underline">
      {CORREO_CONTACTO}
    </a>
  ) : (
    <span className="font-bold">el equipo del área de Inserción Laboral del Comité de Cafeteros de Caldas</span>
  )
}

function Pagina({ titulo, children }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="mb-4 font-body text-sm font-bold text-empresario"
      >
        ← Volver
      </button>
      <h1 className="font-display text-3xl font-bold text-tinta">{titulo}</h1>
      <p className="mt-1 font-body text-sm text-tenue">Comité de Cafeteros de Caldas · Inserción Laboral</p>
      {!TEXTOS_LEGALES_VALIDADOS && (
        <p className="mt-4 rounded-xl bg-naranja/10 px-4 py-3 font-body text-[13px] text-[#B96C00]">
          Este texto está en revisión por el área jurídica del Comité y puede ajustarse antes del
          lanzamiento oficial.
        </p>
      )}
      <div className="mt-6 space-y-5 font-body text-[14.5px] leading-relaxed text-[#3f4133]">{children}</div>
      <p className="mt-10 border-t border-borde pt-4 text-center font-body text-xs text-tenue">
        <Link to="/terminos" className="font-bold">Términos de uso</Link> ·{' '}
        <Link to="/privacidad" className="font-bold">Política de privacidad</Link>
      </p>
    </div>
  )
}

const H = ({ children }) => <h2 className="font-display text-lg font-bold text-tinta">{children}</h2>
const Lista = ({ items }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
)

export function Terminos() {
  return (
    <Pagina titulo="Términos de uso">
      <section>
        <H>¿Para qué sirve esta plataforma?</H>
        <p>
          Inserción Laboral conecta a jóvenes egresados de La Universidad en el Campo con empresarios de
          Caldas, mediante oportunidades de trabajo por habilidades (los “pop-ups”). La desarrolla el
          Comité de Cafeteros de Caldas.
        </p>
      </section>
      <section>
        <H>¿Quién puede registrarse?</H>
        <Lista
          items={[
            `Jóvenes egresados de La Universidad en el Campo, entre ${EDAD_MINIMA} y ${EDAD_MAXIMA} años. Quienes tienen 16 o 17 años necesitan la autorización de su acudiente o representante legal.`,
            'Empresarios y empresas interesadas en contratar talento por habilidades.',
          ]}
        />
      </section>
      <section>
        <H>Uso adecuado</H>
        <Lista
          items={[
            'La información de perfiles, portafolios y pop-ups debe ser veraz y estar actualizada.',
            'No se permite publicar contenido ofensivo, discriminatorio o falso, ni que incumpla la normatividad laboral.',
            'Las oportunidades publicadas deben ser ofertas reales y legítimas.',
          ]}
        />
      </section>
      <section>
        <H>Revisión de contenidos</H>
        <p>
          Todos los perfiles de jóvenes y todos los pop-ups pasan por una revisión del equipo de
          Inserción Laboral antes de ser visibles para los demás.
        </p>
      </section>
      <section>
        <H>Responsabilidad</H>
        <p>
          El Comité de Cafeteros de Caldas facilita el encuentro entre jóvenes y empresarios, pero no es
          parte de las relaciones laborales o contratos que ustedes acuerden. Las condiciones de trabajo y
          de pago son responsabilidad exclusiva de las partes.
        </p>
      </section>
      <section>
        <H>Suspensión de cuentas</H>
        <p>
          Podemos suspender o eliminar las cuentas que incumplan estos términos o la normatividad vigente.
        </p>
      </section>
      <section>
        <H>Tu portafolio</H>
        <p>
          Los jóvenes conservan los derechos sobre su portafolio y evidencias, y autorizan a la plataforma a
          mostrarlos en el directorio de talento con el fin de conectarlos con oportunidades laborales.
        </p>
      </section>
      <section>
        <H>Cambios y contacto</H>
        <p>
          Estos términos pueden actualizarse; seguir usando la plataforma después de un cambio significa que
          lo aceptas. Para dudas o reportes escribe a <Contacto />.
        </p>
      </section>
    </Pagina>
  )
}

export function Privacidad() {
  return (
    <Pagina titulo="Política de privacidad y tratamiento de datos">
      <section>
        <H>¿Quién es el responsable?</H>
        <p>
          El Comité de Cafeteros de Caldas, a través del área de Educación — línea de Inserción Laboral.
          Esta política se basa en la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Habeas Data).
        </p>
      </section>
      <section>
        <H>¿Qué datos recolectamos?</H>
        <Lista
          items={[
            'De los jóvenes: nombre, edad, municipio, datos de contacto, formación, habilidades, proyectos, foto y portafolio.',
            'De los empresarios: nombre de la empresa, NIT, sector, municipio y datos de contacto de la persona que la representa.',
            'Datos de uso: postulaciones, inscripciones a recursos e historial de contrataciones.',
          ]}
        />
      </section>
      <section>
        <H>¿Para qué los usamos?</H>
        <Lista
          items={[
            'Administrar tu registro y tu cuenta.',
            'Conectar jóvenes con oportunidades de trabajo por habilidades.',
            'Mostrar el perfil de los jóvenes aprobados a los empresarios registrados.',
            'Hacer seguimiento a las contrataciones y a la participación en recursos educativos.',
            'Elaborar estadísticas generales (sin identificar a nadie) para reportes institucionales.',
            'Escribirte sobre el uso de la plataforma, por correo o WhatsApp.',
          ]}
        />
      </section>
      <section>
        <H>Tus derechos</H>
        <p>
          Puedes conocer, actualizar, rectificar y pedir la eliminación de tus datos, o retirar tu
          autorización en cualquier momento, escribiendo a <Contacto />.
        </p>
      </section>
      <section>
        <H>Menores de edad</H>
        <p>
          Quienes tienen 16 o 17 años necesitan la autorización de su acudiente o representante legal para
          registrarse y para el tratamiento de sus datos.
        </p>
      </section>
      <section>
        <H>¿Cómo cuidamos tu información?</H>
        <p>
          Los datos se guardan en una plataforma segura y cada persona solo ve lo que su rol permite. El
          acceso administrativo está limitado al equipo autorizado del área de Inserción Laboral.
        </p>
      </section>
      <section>
        <H>¿Cuánto tiempo los guardamos?</H>
        <p>
          Mientras tu cuenta esté activa o sea necesario para las finalidades anteriores. Puedes pedir que se
          eliminen, salvo que exista una obligación legal de conservarlos.
        </p>
      </section>
      <section>
        <H>Cambios</H>
        <p>Si la política cambia de forma importante, te lo informaremos.</p>
      </section>
    </Pagina>
  )
}
