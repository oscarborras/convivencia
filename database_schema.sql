-- /database_schema.sql

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para las horas de clase
CREATE TYPE hora_clase AS ENUM ('1ª', '2ª', '3ª', 'Recreo', '4ª', '5ª', '6ª');

-- Tabla de Partes de Disciplina y Retrasos
CREATE TABLE IF NOT EXISTS partes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora hora_clase NOT NULL,
  
  -- Referencias a las tablas existentes en la base de datos actual
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  
  -- Las conductas seleccionadas del formulario se guardarán en arrays de texto
  conductas_contrarias TEXT[] DEFAULT '{}'::TEXT[],
  conductas_graves TEXT[] DEFAULT '{}'::TEXT[],
  
  genera_expulsion BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies (Draft)
-- ALTER TABLE partes ENABLE ROW LEVEL SECURITY;

-- Ampliación opción B Importar Tutores
-- La tabla 'cursos' se asume con (id, nombre UNIQUE)
ALTER TABLE IF EXISTS cursos ADD COLUMN IF NOT EXISTS email_tutor TEXT;
ALTER TABLE IF EXISTS cursos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Permitir inserts y updates para poder importar
CREATE POLICY "Permitir inserts públicos temporal en cursos" ON cursos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Permitir updates públicos temporal en cursos" ON cursos FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Ampliación para Importar Profesores
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir select público temporal en profesores" ON profesores FOR SELECT TO public USING (true);
CREATE POLICY "Permitir inserts públicos temporal en profesores" ON profesores FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Permitir updates públicos temporal en profesores" ON profesores FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Ampliación para Importar Alumnos con datos CSV Extendidos
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS estado_matricula TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS email_personal TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS primer_apellido TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS segundo_apellido TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor1_primer_apellido TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor1_segundo_apellido TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor1_nombre TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor1_email TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor1_telefono TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor1_sexo TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor2_primer_apellido TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor2_segundo_apellido TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor2_email TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor2_nombre TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor2_sexo TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS tutor2_telefono TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS edad_matricula TEXT;
ALTER TABLE IF EXISTS alumnos ADD COLUMN IF NOT EXISTS fecha_matricula TEXT;

CREATE POLICY "Permitir actualizaciones públicas de alumnos" ON alumnos FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Tabla para opciones dinámicas de "Conductas Contrarias"
CREATE TABLE IF NOT EXISTS convi_opt_contrarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conducta TEXT NOT NULL,
  activa BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0
);

-- Inserción de conductas contrarias de base
INSERT INTO convi_opt_contrarias (conducta, orden) VALUES
('Charlar, interrumpir, molestar al profesorado o compañeros', 10),
('Usar móviles, aparatos electrónicos y similares sin permiso', 20),
('Falta injustificada de puntualidad', 30),
('Comer y/o beber en clase sin permiso', 40),
('No seguir las instrucciones del profesorado', 50),
('No traer el material o pasividad en el trabajo', 60),
('Faltas de asistencia injustificadas', 70),
('Pequeños daños en instalaciones y documentos del Centro', 80),
('Daños a pertenencias de otros miembros de la comunidad', 90),
('Agresión verbal u ofensa leve', 100),
('Alterar el orden en pasillos, patios, accesos', 110),
('Salida de clase sin autorización', 120);

-- Tabla para opciones dinámicas de "Conductas Graves"
CREATE TABLE IF NOT EXISTS convi_opt_graves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conducta TEXT NOT NULL,
  activa BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0
);

-- Inserción de conductas graves de base
INSERT INTO convi_opt_graves (conducta, orden) VALUES
('Injuria verbal y ofensa, escrita, redes ... (cualquier miembro de la comunidad)', 10),
('Vejación con carácter sexual, racial, xenófobo o contra alumnado con N.E.E.', 20),
('Agresión a otra persona', 30),
('Amenaza, coacción o incitación a tercera persona', 40),
('Actuación perjudicial para la salud o incitación a otro miembro de la comunidad', 50),
('Daños graves en instalaciones o documentos del Centro', 60),
('Daños graves a pertenencias de otros miembros de la comunidad y sustración', 70),
('Actos dirigidos a impedir el normal desarrollo de las actividades del Centro', 80),
('Fumar en las dependencias del centro', 90),
('Sustración de documentación académica', 100),
('Suplantación de personalidad en actos de la vida docente', 110),
('Incumplimiento de corrección impuesta', 120),
('Reiteración de conductas contrarias a las normas de convivencia', 130),
('Salida del centro sin autorización (actuación perjudicial para la Comunidad)', 140);
