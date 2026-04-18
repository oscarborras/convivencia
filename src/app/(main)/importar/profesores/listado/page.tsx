import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Briefcase } from 'lucide-react'
import PaginationControls from '@/components/ui/PaginationControls'
import ProfesoresFilters from './Filters'

export const dynamic = 'force-dynamic'

const formatFecha = (s?: string | null) => {
    if (!s) return '—'
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
}

const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default async function ListadoProfesoresPage(props: {
    searchParams: Promise<{ search?: string; sin_email?: string; page?: string; per_page?: string }>
}) {
    const searchParams = await props.searchParams
    const search = searchParams.search?.trim() || ''
    const sinEmail = searchParams.sin_email === '1'
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

    // Accent+case insensitive multi-word JS filter
    const words = search.split(/\s+/).filter(Boolean).map(normalize)
    const filtered = words.length
        ? allData.filter(p => {
            const norm = normalize(p.profesor || '')
            return words.every(w => norm.includes(w))
        })
        : allData

    const total = filtered.length
    const profesores = filtered.slice((page - 1) * perPage, page * perPage)

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
                        <p className="text-sm text-slate-500">{total} registros{search || sinEmail ? ' encontrados' : ' en total'}</p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Link href="/importar/profesores"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                        Importar CSV
                    </Link>
                </div>
            </div>

            <ProfesoresFilters />

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {error ? (
                    <p className="p-8 text-center text-red-500">Error al cargar los datos.</p>
                ) : profesores.length === 0 ? (
                    <p className="p-12 text-center text-slate-400 font-medium">No se encontraron profesores con los filtros aplicados.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="px-5 py-3.5 text-left">Nombre</th>
                                        <th className="px-5 py-3.5 text-left">Puesto</th>
                                        <th className="px-5 py-3.5 text-left">Email</th>
                                        <th className="px-5 py-3.5 text-left">Fecha Alta</th>
                                        <th className="px-5 py-3.5 text-left">Fecha Cese</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {profesores.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3 font-medium text-slate-800">{p.profesor}</td>
                                            <td className="px-5 py-3 text-slate-600 text-xs">{p.puesto || <span className="text-slate-300 italic">—</span>}</td>
                                            <td className="px-5 py-3">
                                                {p.email
                                                    ? <span className="text-slate-600 text-xs">{p.email}</span>
                                                    : <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">Sin email</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{formatFecha(p.fecha_alta)}</td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{formatFecha(p.fecha_cese)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls total={total} page={page} perPage={perPage} />
                    </>
                )}
            </div>
        </div>
    )
}
