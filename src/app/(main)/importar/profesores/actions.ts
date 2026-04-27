'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type DbProfesor = {
    id: string
    profesor: string
    puesto: string | null
    fecha_alta: string | null
    fecha_cese: string | null
}

export type CsvRow = {
    profesor: string
    puesto: string
    fecha_alta?: string
    fecha_cese?: string
}

export type UpdateItem = {
    id: string
    profesor: string
    current: { puesto: string | null; fecha_alta: string | null; fecha_cese: string | null }
    changes: { puesto?: string; fecha_alta?: string; fecha_cese?: string | null }
    reason: 'campos_vacios' | 'contrato_renovado' | 'fecha_cese_modificada'
}

export type NullEmailProfesor = {
    id: string
    profesor: string
    puesto: string | null
}

function getBestRow(rows: CsvRow[]): CsvRow {
    return [...rows].sort((a, b) => {
        if (!a.fecha_cese && b.fecha_cese) return -1
        if (a.fecha_cese && !b.fecha_cese) return 1
        if (a.fecha_alta && b.fecha_alta) return a.fecha_alta > b.fecha_alta ? -1 : 1
        return 0
    })[0]
}

export async function previewProfesoresUpdate(csvRows: CsvRow[]) {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: dbProfs, error } = await supabase
        .from('profesores')
        .select('id, profesor, puesto, fecha_alta, fecha_cese')

    if (error) return { error: error.message, updates: [] as UpdateItem[], newProfesores: [] as CsvRow[] }

    const csvByName = new Map<string, CsvRow[]>()
    for (const row of csvRows) {
        const key = row.profesor.toLowerCase().trim()
        if (!csvByName.has(key)) csvByName.set(key, [])
        csvByName.get(key)!.push(row)
    }

    const dbNames = new Set((dbProfs as DbProfesor[]).map(p => p.profesor.toLowerCase().trim()))
    const csvUniqueNames = new Set(csvRows.map(r => r.profesor.toLowerCase().trim()))

    const newProfesores: CsvRow[] = []
    for (const name of csvUniqueNames) {
        if (!dbNames.has(name)) {
            newProfesores.push(getBestRow(csvByName.get(name)!))
        }
    }

    const updates: UpdateItem[] = []

    for (const dbProf of dbProfs as DbProfesor[]) {
        const key = dbProf.profesor.toLowerCase().trim()
        const rows = csvByName.get(key)
        if (!rows || rows.length === 0) continue

        const best = getBestRow(rows)
        const hasNullFields = !dbProf.puesto || !dbProf.fecha_alta
        const ceseHasPassed = !!dbProf.fecha_cese && dbProf.fecha_cese < today
        const appearsMultiple = rows.length >= 2

        const changes: UpdateItem['changes'] = {}
        let reason: UpdateItem['reason'] | null = null

        if (hasNullFields) {
            reason = 'campos_vacios'
            if (!dbProf.puesto && best.puesto) changes.puesto = best.puesto
            if (!dbProf.fecha_alta && best.fecha_alta) changes.fecha_alta = best.fecha_alta
        }

        if (ceseHasPassed && appearsMultiple) {
            if (!reason) reason = 'contrato_renovado'
            if (best.puesto && best.puesto !== dbProf.puesto) changes.puesto = best.puesto
            if (best.fecha_alta && best.fecha_alta !== dbProf.fecha_alta) changes.fecha_alta = best.fecha_alta
        }

        const newCese = best.fecha_cese || null
        if (newCese !== dbProf.fecha_cese) {
            if (!reason) reason = 'fecha_cese_modificada'
            changes.fecha_cese = newCese
        }

        if (reason && Object.keys(changes).length > 0) {
            updates.push({
                id: dbProf.id,
                profesor: dbProf.profesor,
                current: { puesto: dbProf.puesto, fecha_alta: dbProf.fecha_alta, fecha_cese: dbProf.fecha_cese },
                changes,
                reason,
            })
        }
    }

    return { error: null, updates, newProfesores }
}

export async function applyProfesoresUpdate(updates: Pick<UpdateItem, 'id' | 'changes'>[]) {
    const supabase = await createClient()

    const results = await Promise.all(
        updates.map(u => supabase.from('profesores').update(u.changes).eq('id', u.id))
    )

    const errors = results.filter(r => r.error).map(r => r.error!.message)
    if (errors.length > 0) {
        return { error: `Errores al actualizar: ${errors.slice(0, 3).join(', ')}`, count: 0 }
    }

    revalidatePath('/importar/profesores')
    return { error: null, count: updates.length }
}

export async function insertNewProfesores(professors: CsvRow[]) {
    const supabase = await createClient()

    const toInsert = professors.map(p => ({
        profesor: p.profesor,
        puesto: p.puesto || null,
        fecha_alta: p.fecha_alta || null,
        fecha_cese: p.fecha_cese || null,
    }))

    const { error } = await supabase.from('profesores').insert(toInsert)
    if (error) return { error: error.message, count: 0 }

    revalidatePath('/importar/profesores')
    return { error: null, count: toInsert.length }
}

export async function getProfesoresNullEmail(): Promise<{ error: string | null; profesores: NullEmailProfesor[] }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profesores')
        .select('id, profesor, puesto')
        .or('email.is.null,email.eq.')
        .order('profesor')

    if (error) return { error: error.message, profesores: [] }
    return { error: null, profesores: (data || []) as NullEmailProfesor[] }
}

export async function updateProfesoresEmails(updates: { id: string; email: string }[]) {
    const supabase = await createClient()
    const valid = updates.filter(u => u.email.trim())

    const results = await Promise.all(
        valid.map(u => supabase.from('profesores').update({ email: u.email.trim() }).eq('id', u.id))
    )

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
        return { error: 'Error al actualizar algunos emails', count: 0 }
    }

    revalidatePath('/importar/profesores')
    return { error: null, count: valid.length }
}
