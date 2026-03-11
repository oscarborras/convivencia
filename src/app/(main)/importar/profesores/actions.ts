'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function insertProfesores(payload: { profesor: string, correo: string, puesto: string, fecha_cese?: string }[]) {
    try {
        const supabase = await createClient()

        const profesoresToInsert = payload.map(row => {
            const data: any = {
                profesor: row.profesor,
                email: row.correo,
                puesto: row.puesto
            };

            if (row.fecha_cese && row.fecha_cese.trim() !== '') {
                const parts = row.fecha_cese.split('/');
                if (parts.length === 3) {
                    // Convert DD/MM/YYYY or DD/MM/YY to YYYY-MM-DD
                    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    data.fecha_cese = `${year}-${parts[1]}-${parts[0]}`;
                } else {
                    data.fecha_cese = row.fecha_cese;
                }
            }

            return data;
        })

        // Verify existing profesores using email or name
        const { data: existingProfesores, error: fetchError } = await supabase
            .from('profesores')
            .select('id, profesor, email');
            
        if (fetchError) {
            console.error("Error fetching profesores", fetchError);
            return { error: 'Error al verificar profesores existentes. Revisa la base de datos.', count: 0 };
        }
        
        const existingMapByName = new Map();
        const existingMapByEmail = new Map();

        (existingProfesores || []).forEach(p => {
            if (p.profesor) existingMapByName.set(p.profesor.toLowerCase(), p);
            if (p.email) existingMapByEmail.set(p.email.toLowerCase(), p);
        });

        const newProfesores: any[] = [];
        const updatePromises: any[] = [];

        profesoresToInsert.forEach(p => {
            let existing = null;
            if (p.email && existingMapByEmail.has(p.email.toLowerCase())) {
                existing = existingMapByEmail.get(p.email.toLowerCase());
            } else if (existingMapByName.has(p.profesor.toLowerCase())) {
                existing = existingMapByName.get(p.profesor.toLowerCase());
            }

            if (existing) {
                const updateData: any = {
                    puesto: p.puesto,
                };
                // Only update fecha_cese if we've parsed a new value, or if keeping it consistent.
                // We'll update the provided fields.
                if (p.fecha_cese !== undefined) {
                    updateData.fecha_cese = p.fecha_cese;
                }
                
                // Keep the newer email/profesor names just in case they were updated
                if (p.email && existing.email !== p.email) updateData.email = p.email;
                if (p.profesor && existing.profesor !== p.profesor) updateData.profesor = p.profesor;
                
                updatePromises.push(
                    supabase.from('profesores').update(updateData).eq('id', existing.id).then(res => res)
                );
            } else {
                newProfesores.push(p);
                // Prevent duplicate insertions within the same batch
                if (p.email) existingMapByEmail.set(p.email.toLowerCase(), { id: 'temp' });
                existingMapByName.set(p.profesor.toLowerCase(), { id: 'temp' });
            }
        });

        // Resolve updates and inserts
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }

        if (newProfesores.length > 0) {
            const { error: insertError } = await supabase.from('profesores').insert(newProfesores);
            if (insertError) {
                console.error("Error insertando profesores", insertError);
                return { error: `Error al insertar profesores en la base de datos: ${insertError.message}`, count: updatePromises.length };
            }
        }

        revalidatePath('/dashboard');
        revalidatePath('/importar/profesores');
        
        return { error: null, count: newProfesores.length };
    } catch (e: any) {
        console.error("Excepción en insertProfesores:", e);
        return { error: e.message || 'Error inesperado al procesar la importación del CSV', count: 0 };
    }
}
