import { Link } from 'react-router-dom'

/**
 * Pantalla de bienvenida (pantalla 01 del mockup). Sirve además como prueba
 * visual de que los tokens de Tailwind (paleta + tipografías) funcionan.
 */
export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-lima px-6 pb-8 pt-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="mt-5 rounded-3xl bg-white p-5 shadow-xl shadow-tinta/20">
          <img
            src="/assets/logo.jpg"
            alt="Inserción Laboral"
            className="w-full rounded-xl"
          />
        </div>

        <div className="mt-auto pt-11">
          <h1 className="font-display text-3xl font-bold leading-tight text-tinta">
            Un enlace con las oportunidades
          </h1>
          <p className="mt-2 font-body text-[15px] leading-snug text-tinta/70">
            Conecta tu formación técnica con empresarios que buscan lo que tú
            sabes hacer.
          </p>

          <p className="mb-3 mt-6 font-display text-sm font-semibold text-tinta">
            ¿Cómo quieres entrar?
          </p>

          <Link
            to="/registro?rol=joven"
            className="mb-3.5 flex items-center gap-4 rounded-2xl bg-joven px-5 py-4 text-white shadow-lg shadow-joven/50"
          >
            <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              🌱
            </span>
            <span className="flex-1">
              <span className="block font-display text-lg font-semibold leading-tight">
                Soy joven
              </span>
              <span className="block text-[13px] opacity-90">
                Muestro lo que sé hacer
              </span>
            </span>
            <span className="text-xl opacity-90">→</span>
          </Link>

          <Link
            to="/registro?rol=empresario"
            className="flex items-center gap-4 rounded-2xl bg-tinta px-5 py-4 text-white shadow-lg shadow-tinta/40"
          >
            <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-empresario text-2xl">
              💼
            </span>
            <span className="flex-1">
              <span className="block font-display text-lg font-semibold leading-tight">
                Soy empresario
              </span>
              <span className="block text-[13px] opacity-75">
                Busco talento joven
              </span>
            </span>
            <span className="text-xl opacity-70">→</span>
          </Link>

          <p className="mt-6 text-center font-body text-sm text-tinta/70">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="border-b-2 border-tinta font-bold text-tinta">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
