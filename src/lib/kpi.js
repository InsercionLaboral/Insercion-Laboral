import { supabase } from './supabase.js'
import { diasEntre } from './fechas.js'

const suma = (filas, campo) => filas.reduce((total, f) => total + (f[campo] ?? 0), 0)

/** Contrataciones activas por cada 100 postulaciones (0 si no hay postulaciones). */
export function tasaContratacion(activas, postulaciones) {
  return postulaciones > 0 ? Math.round((activas / postulaciones) * 1000) / 10 : 0
}

/**
 * Indicadores del dashboard: la vista por municipio más totales generales.
 * Solo líder/admin pueden leerlos (lo garantiza la RLS de las tablas base).
 */
export async function cargarKpi() {
  const [vista, contr, recursos, inscripciones] = await Promise.all([
    supabase.from('vista_kpi_municipio').select('*').order('municipio'),
    supabase.from('contrataciones').select('activo, fecha_inicio, fecha_ultimo_seguimiento'),
    supabase.from('recursos').select('id', { count: 'exact', head: true }),
    supabase.from('inscripciones').select('id', { count: 'exact', head: true }),
  ])
  for (const r of [vista, contr, recursos, inscripciones]) {
    if (r.error) throw new Error(r.error.message)
  }

  const municipios = (vista.data ?? []).map((m) => ({
    municipio: m.municipio,
    jovenes: m.jovenes_activos ?? 0,
    empresarios: m.empresarios_registrados ?? 0,
    popups: m.popups_publicados ?? 0,
    postulaciones: m.postulaciones_totales ?? 0,
    contratacionesActivas: m.contrataciones_activas ?? 0,
    tasa: tasaContratacion(m.contrataciones_activas ?? 0, m.postulaciones_totales ?? 0),
  }))

  const contrataciones = contr.data ?? []
  const permanencias = contrataciones
    .map((c) => (c.activo ? diasEntre(c.fecha_inicio) : diasEntre(c.fecha_inicio, c.fecha_ultimo_seguimiento ?? undefined)))
    .filter((d) => d != null)

  const totales = {
    jovenes: suma(municipios, 'jovenes'),
    empresarios: suma(municipios, 'empresarios'),
    popups: suma(municipios, 'popups'),
    postulaciones: suma(municipios, 'postulaciones'),
    contratacionesActivas: suma(municipios, 'contratacionesActivas'),
    contratacionesTotales: contrataciones.length,
    contratacionesFinalizadas: contrataciones.filter((c) => !c.activo).length,
    permanenciaPromedioDias: permanencias.length
      ? Math.round(permanencias.reduce((a, b) => a + b, 0) / permanencias.length)
      : null,
    recursos: recursos.count ?? 0,
    inscripciones: inscripciones.count ?? 0,
  }
  totales.tasa = tasaContratacion(totales.contratacionesActivas, totales.postulaciones)

  return { municipios, totales }
}

// ----------------------------------------------------------------- exportación

function celdaCsv(valor) {
  const texto = valor == null ? '' : String(valor)
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/**
 * Construye el CSV del reporte (separador ";" y BOM UTF-8 para que Excel en
 * español abra tildes y columnas correctamente).
 */
export function construirCsv({ municipios, totales }, fecha = new Date()) {
  const filas = [
    ['Plataforma de Inserción Laboral — Comité de Cafeteros de Caldas'],
    [`Reporte de indicadores generado el ${fecha.toLocaleDateString('es-CO')}`],
    [],
    ['Municipio', 'Jóvenes activos', 'Empresarios', 'Pop-ups publicados', 'Postulaciones', 'Contrataciones activas', 'Tasa de contratación (%)'],
    ...municipios.map((m) => [m.municipio, m.jovenes, m.empresarios, m.popups, m.postulaciones, m.contratacionesActivas, String(m.tasa).replace('.', ',')]),
    ['TOTAL', totales.jovenes, totales.empresarios, totales.popups, totales.postulaciones, totales.contratacionesActivas, String(totales.tasa).replace('.', ',')],
    [],
    ['Contrataciones registradas (total)', totales.contratacionesTotales],
    ['Contrataciones finalizadas', totales.contratacionesFinalizadas],
    ['Permanencia promedio (días)', totales.permanenciaPromedioDias ?? ''],
    ['Recursos educativos publicados', totales.recursos],
    ['Inscripciones a recursos', totales.inscripciones],
  ]
  return '﻿' + filas.map((f) => f.map(celdaCsv).join(';')).join('\r\n')
}

/** Descarga un texto como archivo desde el navegador. */
export function descargarArchivo(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
