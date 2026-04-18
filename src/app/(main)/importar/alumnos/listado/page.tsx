import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import PaginationControls from '@/components/ui/PaginationControls'
import AlumnosFilters from './Filters'
import AlumnosTable from './AlumnosTable'

export const dynamic = 'force-dynamic'

const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default async function ListadoAlumnosPage(props: {
    searchParams: Promise<{ search?: string; unidad?: string; page?: string; per_page?: string }>
}) {
    const searchParams = await props.searchParams
    const search = searchParams.search?.trim() || ''
    const unidad = searchParams.unidad?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.page || '1'))
    const perPageRaw = parseInt(searchParams.per_page || '10')
    const perPage = [10, 25, 50].includes(perPageRaw) ? perPageRaw : 10

    const supabase = await createClient()

    // Unidades para el selector
    const { data: unidadesData } = await supabase
        .from('alumnos').select('unidad').order('unidad')
    const unidades = [...new Set((unidadesData || []).map((r: any) => r.unidad).filter(Boolean))].sort() as string[]

    // Fetch with DB-level filters (non-text only)
    let query = supabase
        .from('alumnos')
        .select('id, alumno, unidad, sexo, email_personal, edad_matricula, fecha_matricula, estado_matricula, primer_apellido, segundo_apellido, nombre, tutor1_primer_apellido, tutor1_segundo_apellido, tutor1_nombre, tutor1_email, tutor1_telefono, tutor1_sexo, tutor2_primer_apellido, tutor2_segundo_apellido, tutor2_nombre, tutor2_email, tutor2_telefono, tutor2_sexo')
        .order('alumno')

    if (unidad) query = query.eq('unidad', unidad)

    const { data, error } = await query
    const allData = data || []

    // Accent+case insensitive multi-word JS filter
    const words = search.split(/\s+/).filter(Boolean).map(normalize)
    const filtered = words.length
        ? allData.filter(a => {
            const norm = normalize(a.alumno || '')
            return words.every(w => norm.includes(w))
        })
        : allData

    const total = filtered.length
    const alumnos = filtered.slice((page - 1) * perPage, page * perPage)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/importar"
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Listado de Alumnos</h1>
                        <p className="text-sm text-slate-500">{total} registros{search || unidad ? ' encontrados' : ' en total'}</p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Link href="/importar/alumnos"
                        className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                        Importar CSV
                    </Link>
                </div>
            </div>

            <AlumnosFilters unidades={unidades} />

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {error ? (
                    <p className="p-8 text-center text-red-500">Error al cargar los datos.</p>
                ) : alumnos.length === 0 ? (
                    <p className="p-12 text-center text-slate-400 font-medium">No se encontraron alumnos con los filtros aplicados.</p>
                ) : (
                    <>
                        <AlumnosTable alumnos={alumnos} />
                        <PaginationControls total={total} page={page} perPage={perPage} />
                    </>
                )}
            </div>
        </div>
    )
}
