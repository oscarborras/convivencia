import { createClient } from '@/lib/supabase/server'
import { History as HistoryIcon, Clock, User, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react'
import RecentRetrasosTable from '@/components/retrasos/RecentRetrasosTable'
import AdvancedFilter from '@/components/dashboard/AdvancedFilter'
import Pagination from '@/components/dashboard/Pagination'

const normalizeText = (text: string) =>
    text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

export default async function RetrasosRegistrosPage(props: { searchParams: Promise<{ q?: string, curso?: string, fecha?: string, page?: string, limit?: string }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    // 1. Obtener filtros de la URL
    const q = searchParams.q || ''
    const curso = searchParams.curso || 'all'
    const fecha = searchParams.fecha || ''
    const page = parseInt(searchParams.page || '1')
    const limit = parseInt(searchParams.limit || '10')
    const offset = (page - 1) * limit

    // 2. Obtener lista de cursos para el filtro
    const { data: alumnosUnicos } = await supabase
        .from('alumnos')
        .select('unidad')
        .order('unidad')

    const unidades = Array.from(new Set(alumnosUnicos?.map(a => a.unidad).filter(Boolean))) as string[]

    // 3. Construir consulta con filtros usando la VISTA
    let query = supabase
        .from('v_retrasos_detallados')
        .select('*', { count: 'exact' })

    // Filtro por Alumno (Soporte multipalaura e insensible a acentos via VISTA y normalizeText)
    if (q) {
        const words = normalizeText(q).split(/\s+/).filter(Boolean)
        words.forEach(word => {
            query = query.ilike('alumno_normalizado', `%${word}%`)
        })
    }

    // Filtro por Curso
    if (curso !== 'all') {
        query = query.eq('unidad', curso)
    }

    // Filtro por Fecha
    if (fecha) {
        query = query.gte('fecha', `${fecha}T00:00:00`).lte('fecha', `${fecha}T23:59:59`)
    }

    // Orden y Paginación
    const { data: allRetrasos, count } = await query
        .order('fecha', { ascending: false })
        .range(offset, offset + limit - 1)

    return (
        <div className="space-y-2 -mt-4 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">
                        <HistoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Historial de Retrasos</h1>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200">
                        Total: {count || 0}
                    </span>
                </div>
            </div>

            <AdvancedFilter baseUrl="/retrasos/registros" unidades={unidades} />

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                <RecentRetrasosTable data={allRetrasos || []} />

                {count ? (
                    <Pagination total={count} limit={limit} currentPage={page} />
                ) : null}
            </div>
        </div>
    )
}
