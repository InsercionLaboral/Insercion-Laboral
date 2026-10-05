/**
 * Contenedor de las pantallas de acceso. En móvil es una sola columna; en
 * desktop es split-screen (panel de marca + formulario), como la pantalla 04
 * del mockup. El panel toma el color del acento activo.
 */
export function AuthShell({ acento = 'joven', children }) {
  const panel =
    acento === 'empresario'
      ? 'bg-empresario'
      : acento === 'tinta'
        ? 'bg-tinta'
        : 'bg-joven'

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* Panel de marca (solo desktop) */}
      <aside
        className={`relative hidden overflow-hidden md:flex md:w-1/2 md:flex-col md:justify-between md:p-12 ${panel}`}
      >
        <div className="pointer-events-none absolute -right-16 top-24 size-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-10 bottom-24 size-52 rounded-full bg-white/10" />
        <img
          src="/assets/logo.jpg"
          alt="Inserción Laboral"
          className="relative z-10 w-64 self-start rounded-3xl shadow-xl shadow-black/20 ring-4 ring-white/30"
        />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Un enlace con las oportunidades
          </h2>
          <p className="mt-3 max-w-sm font-body text-white/90">
            La plataforma que conecta a los jóvenes de La Universidad en el Campo con
            empresarios de Caldas.
          </p>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex flex-1 flex-col bg-fondo px-6 py-8 md:items-center md:justify-center">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col md:flex-none">
          {children}
        </div>
      </main>
    </div>
  )
}
