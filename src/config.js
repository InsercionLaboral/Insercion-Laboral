// Configuración general de la plataforma.

/**
 * Correo oficial del área de Inserción Laboral para derechos de Habeas Data y
 * dudas. Se define en `.env` (VITE_CORREO_CONTACTO). Mientras no exista, los
 * textos legales remiten al equipo del área en lugar de mostrar un marcador.
 */
export const CORREO_CONTACTO = import.meta.env.VITE_CORREO_CONTACTO || null

/**
 * Cambiar a `true` cuando el área jurídica del Comité apruebe los textos de
 * `textos-legales-insercion-laboral.md`. Mientras sea `false`, las páginas de
 * términos y privacidad avisan que están en revisión.
 */
export const TEXTOS_LEGALES_VALIDADOS = false
