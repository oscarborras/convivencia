'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function insertAlumnos(payload: {
    alumno: string;
    unidad: string;
    sexo: string;
    estado_matricula?: string;
    email_personal?: string;
    primer_apellido?: string;
    segundo_apellido?: string;
    nombre?: string;
    tutor1_primer_apellido?: string;
    tutor1_segundo_apellido?: string;
    tutor1_nombre?: string;
    tutor1_email?: string;
    tutor1_telefono?: string;
    tutor1_sexo?: string;
    tutor2_primer_apellido?: string;
    tutor2_segundo_apellido?: string;
    tutor2_email?: string;
    tutor2_nombre?: string;
    tutor2_sexo?: string;
    tutor2_telefono?: string;
    edad_matricula?: string;
    fecha_matricula?: string;
}[]) {
    try {
        const supabase = await createClient()

        // 1. Damos formato a los alumnos para la base de datos
        const alumnosToProcess = payload.map(row => {
            const data: any = {
                alumno: row.alumno,
                unidad: row.unidad,
                sexo: row.sexo || ''
            };
            
            // Adjuntar los nuevos campos si existen
            if (row.estado_matricula) data.estado_matricula = row.estado_matricula;
            if (row.email_personal) data.email_personal = row.email_personal;
            if (row.primer_apellido) data.primer_apellido = row.primer_apellido;
            if (row.segundo_apellido) data.segundo_apellido = row.segundo_apellido;
            if (row.nombre) data.nombre = row.nombre;
            if (row.tutor1_primer_apellido) data.tutor1_primer_apellido = row.tutor1_primer_apellido;
            if (row.tutor1_segundo_apellido) data.tutor1_segundo_apellido = row.tutor1_segundo_apellido;
            if (row.tutor1_nombre) data.tutor1_nombre = row.tutor1_nombre;
            if (row.tutor1_email) data.tutor1_email = row.tutor1_email;
            if (row.tutor1_telefono) data.tutor1_telefono = row.tutor1_telefono;
            if (row.tutor1_sexo) data.tutor1_sexo = row.tutor1_sexo;
            if (row.tutor2_primer_apellido) data.tutor2_primer_apellido = row.tutor2_primer_apellido;
            if (row.tutor2_segundo_apellido) data.tutor2_segundo_apellido = row.tutor2_segundo_apellido;
            if (row.tutor2_email) data.tutor2_email = row.tutor2_email;
            if (row.tutor2_nombre) data.tutor2_nombre = row.tutor2_nombre;
            if (row.tutor2_sexo) data.tutor2_sexo = row.tutor2_sexo;
            if (row.tutor2_telefono) data.tutor2_telefono = row.tutor2_telefono;
            if (row.edad_matricula) data.edad_matricula = row.edad_matricula;
            if (row.fecha_matricula) data.fecha_matricula = row.fecha_matricula;

            return data;
        });

        // 2. Comprobamos los alumnos que ya existen para no duplicar datos pero SI actualizarlos
        const { data: existingAlumnos, error: fetchError } = await supabase
            .from('alumnos')
            .select('id, alumno, unidad');
            
        if (fetchError) {
            console.error("Error fetching alumnos", fetchError);
            return { error: 'Error al verificar alumnos existentes. Revisa la base de datos.', count: 0 };
        }
        
        const normalizeKey = (s: string) => {
            if (!s) return '';
            // Remove accents, lowercase, normalize spaces
            return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
        };

        // Creamos un diccionario con el nombre del alumno para buscar rápido su ID
        const existingMap = new Map((existingAlumnos || []).map(a => [normalizeKey(a.alumno), a.id]));

        const newAlumnos: any[] = [];
        const updatePromises: any[] = [];

        for (const data of alumnosToProcess) {
            const key = normalizeKey(data.alumno);
            const existingId = existingMap.get(key);
            
            if (existingId) {
                // Actualizar los campos
                updatePromises.push(
                    supabase.from('alumnos').update(data).eq('id', existingId).then(res => res)
                );
            } else {
                newAlumnos.push(data);
                // Si el alumno se repite en el propio CSV, lo ignoramos para no insertarlo dos veces
                existingMap.set(key, 'temp-id');
            }
        }

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }

        // 4. Insertamos solo a los Alumnos Nuevos
        if (newAlumnos.length > 0) {
            const { error: insertErr } = await supabase.from('alumnos').insert(newAlumnos);
            if (insertErr) {
                console.error("Error insertando alumnos", insertErr);
                return { error: `Error al insertar alumnos en la base de datos: ${insertErr.message}`, count: 0 };
            }
        }

        // 5. Refrescamos las cachés del dashboard y esta página para que muestren la nueva cantidad de alumnos
        revalidatePath('/dashboard');
        revalidatePath('/importar/alumnos');
        
        return { error: null, count: (newAlumnos.length + updatePromises.length) };
    } catch (e: any) {
        console.error("Excepción en insertAlumnos:", e);
        return { error: e.message || 'Error inesperado al procesar la importación del CSV', count: 0 };
    }
}
