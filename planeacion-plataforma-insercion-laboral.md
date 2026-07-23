# Plataforma de Inserción Laboral — Documento de Planeación

**Comité de Cafeteros de Caldas — Área de Educación / Línea de Inserción Laboral**

---

## 1. Objetivo de la plataforma

Conectar a jóvenes egresados de *La Universidad en el Campo* (línea de Inserción Laboral) con empresarios de Caldas mediante un modelo de contratación por habilidades y competencias ("pop-up"), complementado con recursos de formación y seguimiento de resultados para nutrir la toma de decisiones institucional y la participación en la Subcomisión de Concertación de Políticas Laborales y Salariales.

## 2. Roles de usuario

| Rol | Quién | Acceso |
|---|---|---|
| **Joven** | Egresado de La Universidad en el Campo, 16-28 años | Cuenta propia, registro/login |
| **Empresario** | Empresa local/regional | Cuenta propia, registro/login |
| **Líder de área** | Persona encargada de actualizar y revisar información | Panel de gestión de contenido (perfiles, pop-ups, recursos) |
| **Admin (Alejo)** | Administrador de la plataforma | Acceso total: usuarios, roles, configuración, dashboard KPI |

Nota de arquitectura: en Supabase esto se maneja con una tabla `usuarios` con columna `rol` (`joven` / `empresario` / `lider` / `admin`) vinculada a `auth.users`, y políticas RLS por rol.

## 3. Módulos funcionales

### 3.1 Autenticación y onboarding
- Registro separado por tipo de usuario (formulario distinto para joven vs. empresario).
- Login único, redirección según rol.
- Verificación básica de datos (municipio, documento) para joven; datos de empresa (NIT, sector) para empresario.

### 3.2 Perfil / Portafolio del joven
- Datos personales, municipio, formación (técnico/tecnólogo La Universidad en el Campo).
- Habilidades y competencias (catálogo etiquetable, no solo texto libre — esto habilita los filtros del empresario).
- Portafolio: evidencias, proyectos, certificaciones.
- Foto y presentación breve, siguiendo plantilla del área de comunicaciones del Comité.
- Estado del perfil: borrador / en revisión / aprobado (lo aprueba la líder de área).

### 3.3 Directorio de talento (vista empresario)
- Búsqueda y filtros por habilidad, municipio, disponibilidad.
- Ficha de perfil público del joven (sin datos sensibles).
- Botón de contacto / invitar a pop-up.

### 3.4 Pop-ups de contratación por habilidades
- Empresario publica una oportunidad tipo "pop-up" (vacante puntual o por habilidad específica, no necesariamente un cargo formal tradicional).
- Joven se postula desde su perfil.
- Estado de postulación: enviada / vista / preseleccionado / contratado / descartado.
- Moderación: la líder de área aprueba pop-ups antes de publicarse.

### 3.5 Recursos educativos
- Biblioteca de cursos, webinars, talleres, mentorías, cápsulas educativas e infografías.
- Inscripción del joven a recursos.
- Contenido gestionado por la líder de área / admin (no autoservicio de terceros en el MVP).

### 3.6 Seguimiento y trazabilidad
- Registro de contrataciones efectivas (post pop-up).
- Seguimiento post-contratación (¿sigue vinculado?, tiempo de permanencia).
- Esto alimenta directamente el dashboard KPI.

### 3.7 Dashboard KPI (admin)
- Jóvenes activos por municipio.
- Empresarios registrados.
- Pop-ups publicados / postulaciones / contrataciones efectivas.
- Tasa de contratación por municipio (comparativo).
- Exportable para reportes institucionales (Subcomisión, financiadores).

### 3.8 Panel de administración / gestión de contenido
- Gestión de usuarios y roles.
- Aprobación de perfiles y pop-ups (cola de revisión para la líder de área).
- Gestión de recursos educativos.
- Vista de auditoría básica (quién aprobó qué).

## 4. Modelo de datos (entidades principales, Supabase/Postgres)

```
usuarios          (id, auth_id, rol, nombre, email, municipio, estado, autorizacion_datos, autorizacion_acudiente, created_at)
perfiles_joven    (id, usuario_id, formacion, presentacion, foto_url, estado_revision)
habilidades       (id, nombre, categoria)
joven_habilidades (joven_id, habilidad_id)
empresas          (id, usuario_id, nit, sector, municipio)
popups            (id, empresa_id, titulo, descripcion, habilidades_requeridas[], estado, fecha_publicacion)
postulaciones     (id, popup_id, joven_id, estado, fecha)
contrataciones    (id, postulacion_id, fecha_inicio, activo, fecha_seguimiento)
recursos          (id, tipo, titulo, descripcion, url_recurso, fecha)
inscripciones     (id, recurso_id, joven_id, fecha)
municipios        (id, nombre)
```

## 5. Flujos clave de usuario

1. **Joven se registra** → completa perfil → líder aprueba → perfil visible en directorio.
2. **Empresario se registra** → busca talento por habilidad/municipio → contacta o publica pop-up.
3. **Empresario publica pop-up** → líder aprueba → jóvenes con habilidades coincidentes lo ven / se postulan.
4. **Joven se postula** → empresario revisa postulaciones → marca contratado.
5. **Contratación registrada** → entra a seguimiento → alimenta dashboard KPI.
6. **Admin/líder** revisan cola de aprobaciones (perfiles + pop-ups) y gestionan recursos educativos.

## 6. Arquitectura técnica

- **Frontend:** React + Vite (JSX)
- **Backend / datos / auth:** Supabase (Postgres + Auth + Row Level Security por rol + Storage para fotos/certificados)
- **Despliegue:** Vercel
- **Control de acceso:** RLS en Supabase — joven solo edita su perfil, empresario solo sus pop-ups, líder/admin con permisos ampliados vía políticas específicas.

## 7. Fases de construcción sugeridas (dentro del alcance completo)

Aunque el alcance final es el ecosistema completo, construirlo en este orden reduce riesgo y te da algo funcional rápido:

1. **Base:** Auth + roles + perfiles de joven + directorio para empresario.
2. **Núcleo del modelo:** Pop-ups + postulaciones + panel de aprobación (líder).
3. **Cierre del ciclo:** Contrataciones + seguimiento.
4. **Valor institucional:** Dashboard KPI + recursos educativos.

## 8. Consideraciones adicionales (aprobadas)

### 8.1 Menores de edad y protección de datos (Ley 1581 de 2012 — Habeas Data)
- Casilla de autorización de tratamiento de datos personales en el registro (obligatoria, todos los usuarios).
- Para jóvenes de 16-17 años: campo adicional de autorización de acudiente/representante legal en el registro.
- Esto debe reflejarse en el modelo de datos (`usuarios`: campo `autorizacion_datos`, `autorizacion_acudiente` si aplica) y bloquear el flujo de registro hasta marcarlas.

### 8.2 Notificaciones por WhatsApp — evaluado, se difiere el costo
- La API oficial de WhatsApp Business no tiene mensualidad fija de Meta, pero sí cobra por mensaje de plantilla enviado (categoría "utilidad", centavos de USD por mensaje) y requiere un proveedor (BSP) con tarifa mensual aparte.
- **Decisión para el MVP:** no se integra la API de pago. Se usan **enlaces de WhatsApp tipo "clic para chatear" (`wa.me`)** para que joven/empresario inicien la conversación por su cuenta cuando la plataforma lo sugiera (postulación enviada, pop-up nuevo en su municipio, etc.). Sin costo, sin BSP.
- La API de pago con notificaciones automáticas queda como mejora de fase posterior, sujeta a presupuesto institucional.

### 8.3 Diseño mobile-first y bajo consumo de datos
- Prioridad de diseño: la plataforma debe funcionar bien en móvil de gama media con conexión inestable.
- Imágenes optimizadas/comprimidas, carga progresiva, mínimo peso por página. Esto es un requisito no funcional para pasar a Claude Design.

### 8.4 Onboarding / acompañamiento inicial
- Tutorial corto o guía visual en el primer login, diferenciado para joven y empresario, dado que el documento de sistematización anticipa la necesidad de "acompañamiento inicial para garantizar su uso autónomo".

### 8.5 Panel de administración sin dependencia técnica
- La líder de área debe poder aprobar perfiles, pop-ups y gestionar recursos educativos sin necesitar soporte técnico para cada acción — UI simple, no requiere que dependa de Alejo para operaciones rutinarias.

### 8.6 Términos de uso y política de privacidad
- Documento legal obligatorio antes de recoger datos personales y publicarlos en el directorio visible para empresarios. Se redacta en paralelo al desarrollo (no bloquea la construcción, pero sí el lanzamiento).

### 8.7 Exportación de datos del dashboard KPI
- El dashboard KPI debe permitir exportar en CSV/PDF, no solo visualización en pantalla — necesario para los informes que se presentan a la Subcomisión de Concertación de Políticas Laborales y Salariales y a financiadores.

## 9. Siguiente paso

Con esta estructura lista, el siguiente paso es pasar esto a **Claude Design** para definir la identidad visual y los wireframes de las pantallas clave (registro joven/empresario, perfil, directorio, pop-up, dashboard admin, onboarding), y luego construir en **Claude Code** siguiendo las fases de la sección 7.
