import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Briefcase } from 'lucide-react'
import PaginationControls from '@/components/ui/PaginationControls'
import ProfesoresFilters from './Filters'
import ProfesoresActivosModal from './ProfesoresActivosModal'
import ProfesoresTable from './ProfesoresTable'

export const dynamic = 'force-dynamic'

const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default async function ListadoProfesoresPage(props: {
    searchParams: Promise<{ search?: string; sin_email?: string; solo_activos?: string; puesto?: string; page?: string; per_page?: string }>
}) {
    const searchParams = await props.searchParams
    const search = searchParams.search?.trim() || ''
    const sinEmail = searchParams.sin_email === '1'
    const soloActivos = searchParams.solo_activos === '1'
    const puesto = searchParams.puesto?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.page || '1'))
    const perPageRaw = parseInt(searchParams.per_page || '10')
    const perPage = [10, 25, 50].includes(perPageRaw) ? perPageRaw : 10

    const supabase = await createClient()

    // Fetch all (no text filter at DB level) — only apply non-text filters
    let query = supabase
        .from('profesores')
        .select('id, profesor, puesto, email, fecha_alta, fecha_cese')
        .order('profesor')

    if (sinEmail) query = query.or('email.is.null,email.eq.')

    const { data, error } = await query
    const allData = data || []

    const puestos = [...new Set(allData.map(p => p.puesto).filter(Boolean))].sort() as string[]

    // Accent+case insensitive multi-word JS filter
    const today = new Date().toISOString().slice(0, 10)
    const words = search.split(/\s+/).filter(Boolean).map(normalize)
    const filtered = allData.filter(p => {
        if (words.length) {
            const norm = normalize(p.profesor || '')
            if (!words.every(w => norm.includes(w))) return false
        }
        if (soloActivos && p.fecha_cese && p.fecha_cese <= today) return false
        if (puesto && p.puesto !== puesto) return false
        return true
    })

    const total = filtered.length
    const profesores = filtered.slice((page - 1) * perPage, page * perPage)

    const activos = allData.filter(p => !p.fecha_cese || p.fecha_cese > today)
    const profesoresActivos = activos.map(p => p.profesor as string)
    const emailsActivos = activos.map(p => p.email as string | null).filter(Boolean) as string[]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/importar"
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2.5 rounded-2xl text-orange-600">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Listado de Profesores</h1>
                        <p className="text-sm text-slate-500">{total} registros{search || sinEmail || soloActivos || puesto ? ' encontrados' : ' en total'}</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <ProfesoresActivosModal nombres={profesoresActivos} emails={emailsActivos} />
                    <Link href="/importar/profesores"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                        Importar CSV
                    </Link>
                </div>
            </div>

            <ProfesoresFilters puestos={puestos} />

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {error ? (
                    <p className="p-8 text-center text-red-500">Error al cargar los datos.</p>
                ) : profesores.length === 0 ? (
                    <p className="p-12 text-center text-slate-400 font-medium">No se encontraron profesores con los filtros aplicados.</p>
                ) : (
                    <>
                        <ProfesoresTable profesores={profesores} />
                        <PaginationControls total={total} page={page} perPage={perPage} />
                    </>
                )}
            </div>
        </div>
    )
}
