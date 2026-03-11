'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function insertTutores(rows: { curso: string; correo: string }[]) {
    try {
        const supabase = await createClient()

        // Formateamos los datos para la tabla cursos
        const cursosAImportar = rows.map(r => ({
            nombre: r.curso,
            email_tutor: r.correo
        }))

        // Debido a posibles restricciones o falta de id explícito que necesita upsert a veces,
        // Enfoque clásico: Obtenemos los cursos, para los nuevos hacemos insert, para los existentes hacemos update
        const { data: existingCursos, error: fetchError } = await supabase
            .from('cursos')
            .select('id, nombre')
        
        if (fetchError) {
             console.error('Error fetching cursos', fetchError)
             return { error: 'Error al consultar listado actual.', count: 0 }
        }

        const existingMap = new Map((existingCursos || []).map(c => [c.nombre, c.id]))
        let insertCount = 0;

        for (const c of cursosAImportar) {
            const courseId = existingMap.get(c.nombre)
            if (courseId) {
                // Existe, actualizar
                const { error: updErr } = await supabase
                    .from('cursos')
                    .update({ email_tutor: c.email_tutor, updated_at: new Date().toISOString() })
                    .eq('id', courseId)
                if (updErr) console.error("Error update course", updErr)
                else insertCount++;
            } else {
                // Nuevo curso
                const { error: insErr } = await supabase
                    .from('cursos')
                    .insert({ nombre: c.nombre, email_tutor: c.email_tutor })
                if (insErr) console.error("Error insert course", insErr)
                else insertCount++;
            }
        }

        revalidatePath('/importar/tutores')
        
        return { error: null, count: rows.length }
    } catch (error: any) {
        console.error('Error Inesperado tutores:', error)
        return { error: 'Ha ocurrido un error inesperado importando tutores.', count: 0 }
    }
}
