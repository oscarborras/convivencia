'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CsvRow = {
    alumno: string
    unidad: string
    sexo: string
    estado_matricula?: string
    email_personal?: string
    primer_apellido?: string
    segundo_apellido?: string
    nombre?: string
    tutor1_primer_apellido?: string
    tutor1_segundo_apellido?: string
    tutor1_nombre?: string
    tutor1_email?: string
    tutor1_telefono?: string
    tutor1_sexo?: string
    tutor2_primer_apellido?: string
    tutor2_segundo_apellido?: string
    tutor2_email?: string
    tutor2_nombre?: string
    tutor2_sexo?: string
    tutor2_telefono?: string
    edad_matricula?: string
    fecha_matricula?: string
}

export type UpdateItem = {
    id: string
    alumno: string
    unidad: string
    row: CsvRow
}

const OPT_FIELDS = [
    'estado_matricula', 'email_personal', 'primer_apellido', 'segundo_apellido', 'nombre',
    'tutor1_primer_apellido', 'tutor1_segundo_apellido', 'tutor1_nombre', 'tutor1_email',
    'tutor1_telefono', 'tutor1_sexo', 'tutor2_primer_apellido', 'tutor2_segundo_apellido',
    'tutor2_email', 'tutor2_nombre', 'tutor2_sexo', 'tutor2_telefono', 'edad_matricula', 'fecha_matricula',
] as const

const normalizeKey = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

function buildData(row: CsvRow): Record<string, string> {
    const data: Record<string, string> = { alumno: row.alumno, unidad: row.unidad, sexo: row.sexo || '' }
    for (const f of OPT_FIELDS) {
        if (row[f]) data[f] = row[f]!
    }
    return data
}

export async function previewAlumnosUpdate(csvRows: CsvRow[]) {
    const supabase = await createClient()

    const { data: dbAlumnos, error } = await supabase
        .from('alumnos')
        .select('id, alumno, unidad')

    if (error) return { error: error.message, toUpdate: [] as UpdateItem[], toInsert: [] as CsvRow[] }

    const dbMap = new Map((dbAlumnos || []).map((a: { id: string; alumno: string; unidad: string }) => [normalizeKey(a.alumno), a.id]))

    const toUpdate: UpdateItem[] = []
    const toInsert: CsvRow[] = []
    const seenKeys = new Set<string>()

    for (const row of csvRows) {
        const key = normalizeKey(row.alumno)
        const existingId = dbMap.get(key)
        if (existingId) {
            toUpdate.push({ id: existingId, alumno: row.alumno, unidad: row.unidad, row })
            seenKeys.add(key)
        } else if (!seenKeys.has(key)) {
            seenKeys.add(key)
            toInsert.push(row)
        }
    }

    return { error: null, toUpdate, toInsert }
}

export async function applyAlumnosUpdate(updates: UpdateItem[]) {
    const supabase = await createClient()

    const results = await Promise.all(
        updates.map(u => supabase.from('alumnos').update(buildData(u.row)).eq('id', u.id))
    )

    const errors = results.filter(r => r.error).map(r => r.error!.message)
    if (errors.length > 0) return { error: `Errores al actualizar: ${errors.slice(0, 3).join(', ')}`, count: 0 }

    revalidatePath('/importar/alumnos')
    return { error: null, count: updates.length }
}

export async function insertNewAlumnos(alumnos: CsvRow[]) {
    const supabase = await createClient()

    const { error } = await supabase.from('alumnos').insert(alumnos.map(buildData))
    if (error) return { error: error.message, count: 0 }

    revalidatePath('/importar/alumnos')
    revalidatePath('/dashboard')
    return { error: null, count: alumnos.length }
}
