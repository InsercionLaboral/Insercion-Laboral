// Configuración general de la plataforma.

/**
 * Correo oficial del área de Inserción Laboral para derechos de Habeas Data y
 * dudas (el de la líder de área). Se puede cambiar sin tocar el código con la
 * variable VITE_CORREO_CONTACTO.
 */
export const CORREO_CONTACTO = import.meta.env.VITE_CORREO_CONTACTO || 'edurural.giraldo.lucelly@gmail.com'

/**
 * Textos de términos y privacidad aprobados por el área jurídica del Comité
 * (octubre de 2026). Si se modifican y vuelven a revisión, poner `false`: las
 * páginas legales mostrarán un aviso de "en revisión".
 */
export const TEXTOS_LEGALES_VALIDADOS = true
