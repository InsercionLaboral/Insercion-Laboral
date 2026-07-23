/**
 * Comprime una imagen en el navegador antes de subirla (requisito de bajo
 * consumo de datos). Redimensiona al lado máximo indicado y exporta a WebP.
 * Devuelve un Blob.
 */
export async function comprimirImagen(file, { maxLado = 512, calidad = 0.8 } = {}) {
  const bitmap = await cargarBitmap(file)
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  if (bitmap.close) bitmap.close()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/webp', calidad),
  )
  if (!blob) throw new Error('No se pudo procesar la imagen.')
  return blob
}

async function cargarBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // Cae al método con <img> si el formato no es soportado por createImageBitmap.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      el.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}
