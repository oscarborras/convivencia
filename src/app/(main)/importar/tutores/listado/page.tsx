import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, FileSpreadsheet, Mail } from 'lucide-react'
import PaginationControls from '@/components/ui/PaginationControls'
import TutoresFilters from './Filters'

export const dynamic = 'force-dynamic'

const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default async function ListadoTutoresPage(props: {
    searchParams: Promise<{ search?: string; sin_email?: string; page?: string; per_page?: string }>
}) {
    const searchParams = await props.searchParams
    const search = searchParams.search?.trim() || ''
    const sinEmail = searchParams.sin_email === '1'
    const page = Math.max(1, parseInt(searchParams.page || '1'))
    const perPageRaw = parseInt(searchParams.per_page || '10')
    const perPage = [10, 25, 50].includes(perPageRaw) ? perPageRaw : 10

    const supabase = await createClient()

    let query = supabase
        .from('cursos')
        .select('id, nombre, email_tutor')
        .order('nombre')

    if (sinEmail) query = query.or('email_tutor.is.null,email_tutor.eq.')

    const { data, error } = await query
    const allData = data || []

    // Accent+case insensitive multi-word JS filter
    const words = search.split(/\s+/).filter(Boolean).map(normalize)
    const filtered = words.length
        ? allData.filter(c => {
            const norm = normalize(c.nombre || '')
            return words.every(w => norm.includes(w))
        })
        : allData

    const total = filtered.length
    const cursos = filtered.slice((page - 1) * perPage, page * perPage)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/importar"
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2.5 rounded-2xl text-purple-600">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Listado de Tutores</h1>
                        <p className="text-sm text-slate-500">{total} cursos{search || sinEmail ? ' encontrados' : ' en total'}</p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Link href="/importar/tutores"
                        className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                        Importar CSV
                    </Link>
                </div>
            </div>

            <TutoresFilters />

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {error ? (
                    <p className="p-8 text-center text-red-500">Error al cargar los datos.</p>
                ) : cursos.length === 0 ? (
                    <p className="p-12 text-center text-slate-400 font-medium">No se encontraron cursos con los filtros aplicados.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="px-5 py-3.5 text-left">Curso</th>
                                        <th className="px-5 py-3.5 text-left">Email tutor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {cursos.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3 font-medium text-slate-800">
                                                <span className="bg-purple-50 text-purple-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                                                    {c.nombre}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {c.email_tutor
                                                    ? <span className="flex items-center gap-1.5 text-slate-600 text-xs">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        {c.email_tutor}
                                                    </span>
                                                    : <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">Sin email</span>
                                                }
                                            </td>
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
