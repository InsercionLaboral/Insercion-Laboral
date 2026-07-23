const COLORES = ['bg-naranja', 'bg-empresario', 'bg-joven', 'bg-tinta']

function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '·'
  const primera = partes[0][0]
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + segunda).toUpperCase()
}

function colorDeNombre(nombre = '') {
  let s = 0
  for (let i = 0; i < nombre.length; i++) s += nombre.charCodeAt(i)
  return COLORES[s % COLORES.length]
}

/**
 * Avatar del joven: muestra la foto si existe; si no, las iniciales sobre un
 * color derivado del nombre. `className` controla el tamaño (ej. "size-14").
 */
export function Avatar({ nombre, fotoUrl, className = 'size-14', texto = 'text-lg' }) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={nombre}
        loading="lazy"
        className={`${className} shrink-0 rounded-2xl object-cover`}
      />
    )
  }
  return (
    <span
      className={`${className} ${colorDeNombre(nombre)} ${texto} flex shrink-0 items-center justify-center rounded-2xl font-display font-bold text-white`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  )
}
