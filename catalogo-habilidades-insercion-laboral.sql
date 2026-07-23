-- ============================================================================
-- CATÁLOGO DE HABILIDADES — Plataforma Inserción Laboral
-- Derivado de los 12 programas técnicos/tecnológicos de
-- La Universidad en el Campo (Comité de Cafeteros de Caldas)
-- ============================================================================
-- Correr después de schema-supabase-insercion-laboral.sql
-- (requiere que la tabla `habilidades` ya exista)
-- ============================================================================

insert into habilidades (nombre, categoria) values

-- Turismo y servicios
('Atención al cliente en servicios turísticos', 'Turismo y Servicios'),
('Operación de empresas turísticas', 'Turismo y Servicios'),
('Gestión de empresas turísticas', 'Turismo y Servicios'),
('Formulación de proyectos turísticos sostenibles', 'Turismo y Servicios'),
('Promoción y aprovechamiento de atractivos turísticos', 'Turismo y Servicios'),

-- Tecnología e IoT
('Instalación de sensores y dispositivos IoT', 'Tecnología e IoT'),
('Programación de dispositivos IoT', 'Tecnología e IoT'),
('Conectividad y redes para IoT', 'Tecnología e IoT'),
('Mantenimiento de sistemas IoT', 'Tecnología e IoT'),
('Análisis de datos para IoT', 'Tecnología e IoT'),
('Optimización de procesos con tecnología IoT', 'Tecnología e IoT'),

-- Producción agrícola
('Control de calidad y trazabilidad agrícola', 'Producción Agrícola'),
('Prevención de riesgos laborales y ambientales en campo', 'Producción Agrícola'),
('Manejo de herramientas administrativas para producción agrícola', 'Producción Agrícola'),
('Producción agrícola sostenible', 'Producción Agrícola'),
('Digitación y registro de información de producción', 'Producción Agrícola'),
('Gestión de empresas agrícolas', 'Producción Agrícola'),

-- Gestión de proyectos agropecuarios
('Planeación y formulación de proyectos agropecuarios', 'Gestión de Proyectos Agropecuarios'),
('Evaluación y gestión de proyectos', 'Gestión de Proyectos Agropecuarios'),
('Integración de sostenibilidad y equidad en proyectos rurales', 'Gestión de Proyectos Agropecuarios'),
('Manejo de herramientas tecnológicas para gestión de proyectos', 'Gestión de Proyectos Agropecuarios'),
('Trabajo comunitario con el sector agrario', 'Gestión de Proyectos Agropecuarios'),
('Administración de empresas y proyectos agropecuarios', 'Gestión de Proyectos Agropecuarios'),
('Asesoría y consultoría agropecuaria', 'Gestión de Proyectos Agropecuarios'),

-- Producción y gestión cafetera
('Manejo de residuos del beneficio del café', 'Producción Cafetera'),
('Herramientas administrativas para producción cafetera', 'Producción Cafetera'),
('Monitoreo de sistemas de producción cafetera', 'Producción Cafetera'),
('Mantenimiento preventivo de equipos de producción cafetera', 'Producción Cafetera'),
('Investigación aplicada a propuestas productivas de café', 'Producción Cafetera'),
('Negociación y técnicas administrativas para café', 'Producción Cafetera'),
('Planeación financiera de proyectos cafeteros', 'Producción Cafetera'),
('Normatividad de cafés especiales', 'Producción Cafetera'),

-- Ambiental y saneamiento
('Inspección y control de riesgos ambientales', 'Ambiental y Saneamiento'),
('Control de calidad de agua', 'Ambiental y Saneamiento'),
('Control de desechos y saneamiento', 'Ambiental y Saneamiento'),
('Vigilancia de riesgos ocupacionales', 'Ambiental y Saneamiento'),
('Gestión y conservación ambiental', 'Ambiental y Saneamiento'),

-- Transversales (comunes a varios programas)
('Trabajo en equipo', 'Transversales'),
('Pensamiento crítico', 'Transversales'),
('Vocación de servicio', 'Transversales'),
('Manejo de herramientas ofimáticas', 'Transversales'),
('Elaboración de informes y formularios', 'Transversales')

on conflict (nombre) do nothing;
