import { createClient } from '@/lib/supabase/server'
import { FileText, AlertTriangle, ShieldAlert, Calendar, Users, AlertOctagon, History as HistoryIcon, PieChart as PieChartIcon, User, AlertCircle } from 'lucide-react'
import RetrasosCharts from '@/components/retrasos/RetrasosCharts'
import PartesGravityChart from '@/components/dashboard/PartesGravityChart'
import PartesFilter from '@/components/dashboard/PartesFilter'

export default async function PartesDashboardPage(props: { searchParams: Promise<{ period?: string }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()

    // 0. Obtener configuración de trimestres
    const { data: configData } = await supabase.from('convi_config').select('*').single()

    // Identificar trimestre actual
    let currentT = 'total'
    if (configData) {
        const t1S = new Date(configData.trimestre1_inicio)
        const t1E = new Date(configData.trimestre1_fin)
        const t2S = new Date(configData.trimestre2_inicio)
        const t2E = new Date(configData.trimestre2_fin)
        const t3S = new Date(configData.trimestre3_inicio)
        const t3E = new Date(configData.trimestre3_fin)

        if (now >= t1S && now <= t1E) currentT = '1'
        else if (now >= t2S && now <= t2E) currentT = '2'
        else if (now >= t3S && now <= t3E) currentT = '3'
    }

    const selectedPeriod = searchParams.period || currentT

    // Definir límites de fecha para el filtro
    let filterStart = '2000-01-01'
    let filterEnd = '2099-12-31'

    if (configData && selectedPeriod !== 'total') {
        filterStart = configData[`trimestre${selectedPeriod}_inicio`]
        filterEnd = configData[`trimestre${selectedPeriod}_fin`]
    } else if (configData && selectedPeriod === 'total') {
        filterStart = configData.trimestre1_inicio
        filterEnd = configData.trimestre3_fin
    }

    // 1. Estadísticas básicas (Hoy)
    const { count: totalHoy } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today)

    // Partes Leves (con conductas contrarias, filtrado por periodo)
    const { count: totalPartesLeves } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .neq('conductas_contrarias', '{}')
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    // Partes Graves (con conductas graves, filtrado por periodo)
    const { count: totalPartesGraves } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .neq('conductas_graves', '{}')
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    // 2. Obtener datos detallados del periodo para estadísticas agrupadas
    const { data: partesPeriodo } = await supabase
        .from('convi_partes')
        .select(`
            conductas_contrarias,
            conductas_graves,
            profesores (profesor),
            alumnos (unidad)
        `)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    // Procesar datos para gráficos y estadísticas
    const unidadCounts: Record<string, number> = {}
    const profCounts: Record<string, { name: string, leves: number, graves: number, total: number }> = {}
    let levesCount = 0
    let gravesCount = 0

    partesPeriodo?.forEach((r: any) => {
        // Unidades
        const unidad = (Array.isArray(r.alumnos) ? r.alumnos[0] : r.alumnos)?.unidad || 'Sin Unidad'
        unidadCounts[unidad] = (unidadCounts[unidad] || 0) + 1

        // Profesores
        const profName = (Array.isArray(r.profesores) ? r.profesores[0] : r.profesores)?.profesor || 'Desconocido'
        if (!profCounts[profName]) {
            profCounts[profName] = { name: profName, leves: 0, graves: 0, total: 0 }
        }

        const isLeve = r.conductas_contrarias && r.conductas_contrarias.length > 0 && JSON.stringify(r.conductas_contrarias) !== '[]' && JSON.stringify(r.conductas_contrarias) !== '{}'
        const isGrave = r.conductas_graves && r.conductas_graves.length > 0 && JSON.stringify(r.conductas_graves) !== '[]' && JSON.stringify(r.conductas_graves) !== '{}'

        if (isLeve) { profCounts[profName].leves++; levesCount++ }
        if (isGrave) { profCounts[profName].graves++; gravesCount++ }
        profCounts[profName].total++
    })

    const chartData = Object.entries(unidadCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

    const professorStats = Object.values(profCounts)
        .sort((a, b) => b.total - a.total)


    const gravityChartData = [
        { name: 'Leves', value: levesCount, color: '#10b981' },
        { name: 'Graves', value: gravesCount, color: '#f59e0b' }
    ]
    const totalPartesPeriodo = partesPeriodo?.length || 0

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard de Partes</h1>
                    <p className="text-gray-500 mt-1">Análisis y seguimiento de incidencias disciplinarias.</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/partes/historial"
                        className="inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-2xl font-semibold border border-gray-200 hover:border-gray-900 transition-all shadow-sm"
                    >
                        <HistoryIcon className="w-5 h-5" />
                        Historial
                    </a>
                    <a
                        href="/partes/crear"
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                        <ShieldAlert className="w-5 h-5" />
                        Nuevo Parte
                    </a>
                </div>
            </div>

            <div className="flex justify-end -mt-4">
                <PartesFilter currentFilter={selectedPeriod} />
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
                        <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Periodo</p>
                            <p className="text-2xl font-bold">{partesPeriodo?.length || 0}</p>
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

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Distribución por Unidad */}
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-8 font-display">Partes por Unidad</h2>
                    <div className="h-[400px]">
                        <RetrasosCharts data={chartData} yAxisWidth={120} />
                    </div>
                </div>

                {/* Distribución por Gravedad */}
                <div className="lg:col-span-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tipos de Partes</h2>
                            <p className="text-sm text-gray-500 font-medium">Distribución por Gravedad</p>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                            <PieChartIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <PartesGravityChart data={gravityChartData} total={totalPartesPeriodo} />
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Actividad por Profesor */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Actividad por Profesor</h2>
                            <p className="text-sm text-gray-500 font-medium">Partes registrados en el periodo seleccionado</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Profesor</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center leading-tight">Leves</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center leading-tight">Graves</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center leading-tight">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {professorStats.map((prof, idx) => (
                                    <tr key={idx} className="group hover:bg-rose-50/30 transition-all cursor-default">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2.5 rounded-xl text-gray-500 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-gray-900 group-hover:text-rose-700 transition-colors uppercase text-sm tracking-tight">{prof.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-bold border border-amber-100/50">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                {prof.leves}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-bold border border-orange-100/50">
                                                <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                                                {prof.graves}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-rose-600 bg-rose-50 w-8 h-8 inline-flex items-center justify-center rounded-xl shadow-sm border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                {prof.total}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {professorStats.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                                            No hay actividad registrada en este periodo
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
