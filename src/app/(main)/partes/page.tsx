import { createClient } from '@/lib/supabase/server'
import { FileText, AlertTriangle, ShieldAlert, Calendar, Users, AlertOctagon } from 'lucide-react'
import RetrasosCharts from '@/components/retrasos/RetrasosCharts'
import RecentPartesTable from '@/components/retrasos/RecentPartesTable'

export default async function PartesDashboardPage() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // 1. Estadísticas básicas
    const { count: totalHoy } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today)

    // Partes Leves (con conductas contrarias seleccionadas)
    const { count: totalPartesLeves } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .neq('conductas_contrarias', '{}')

    // Partes Graves (con conductas graves seleccionadas)
    const { count: totalPartesGraves } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .neq('conductas_graves', '{}')

    // 2. Datos para el gráfico de partes por curso
    const { data: partesPorCursoRaw } = await supabase
        .from('convi_partes')
        .select(`
            id,
            alumnos (
                unidad
            )
        `)

    const counts: Record<string, number> = {}
    partesPorCursoRaw?.forEach((r: any) => {
        // Manejamos si alumnos es objeto o array
        const alumno = Array.isArray(r.alumnos) ? r.alumnos[0] : r.alumnos
        const curso = alumno?.unidad || 'Sin Curso'
        const cursoSimplificado = curso.split(' ').slice(0, 2).join(' ')
        counts[cursoSimplificado] = (counts[cursoSimplificado] || 0) + 1
    })

    const chartData = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    // 3. Últimos 10 partes para la tabla
    const { data: recentPartes } = await supabase
        .from('convi_partes')
        .select(`
            id,
            fecha,
            hora,
            conductas_contrarias,
            conductas_graves,
            genera_expulsion,
            observaciones,
            alumnos (
                alumno,
                unidad
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard de Partes</h1>
                    <p className="text-gray-500 mt-1">Análisis y seguimiento de incidencias disciplinarias.</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/partes/crear"
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                        <ShieldAlert className="w-5 h-5" />
                        Nuevo Parte
                    </a>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Hoy</p>
                            <p className="text-2xl font-bold">{totalHoy || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Partes Leves</p>
                            <p className="text-2xl font-bold">{totalPartesLeves || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 p-3 rounded-2xl text-red-600">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Partes Graves</p>
                            <p className="text-2xl font-bold">{totalPartesGraves || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Histórico</p>
                            <p className="text-2xl font-bold">{(partesPorCursoRaw?.length || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Distribución por Gráfico */}
                <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Partes por Nivel</h2>
                    <RetrasosCharts data={chartData} />
                </div>

                {/* Tabla de Recientes */}
                <div className="lg:col-span-9 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Partes Recientes</h2>
                    <RecentPartesTable data={recentPartes || []} />
                </div>
            </div>
        </div>
    )
}
