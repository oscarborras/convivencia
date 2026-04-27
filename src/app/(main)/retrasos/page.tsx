import { createClient } from '@/lib/supabase/server'
import { Clock, AlertTriangle, CheckCircle, Calendar, Users, History as HistoryIcon, ShieldAlert } from 'lucide-react'
import RetrasosCharts from '@/components/retrasos/RetrasosCharts'
import PartesGravityChart from '@/components/dashboard/PartesGravityChart'
import RetrasosFilter from '@/components/dashboard/RetrasosFilter'
import { PieChart as PieChartIcon } from 'lucide-react'

export default async function RetrasosDashboardPage(props: { searchParams: Promise<{ period?: string }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()

    // 1. Obtener configuración de trimestres
    const { data: config } = await supabase
        .from('convi_config')
        .select('*')
        .single()

    // 2. Determinar periodo seleccionado
    let currentT = 'total'
    if (config) {
        if (today >= config.trimestre1_inicio && today <= config.trimestre1_fin) currentT = '1'
        else if (today >= config.trimestre2_inicio && today <= config.trimestre2_fin) currentT = '2'
        else if (today >= config.trimestre3_inicio && today <= config.trimestre3_fin) currentT = '3'
    }

    const selectedPeriod = searchParams.period || currentT

    let filterStart = '2000-01-01'
    let filterEnd = '2099-12-31'
    let nombrePeriodo = 'Total Curso'

    if (config && selectedPeriod !== 'total') {
        filterStart = config[`trimestre${selectedPeriod}_inicio`]
        filterEnd = config[`trimestre${selectedPeriod}_fin`]
        nombrePeriodo = `${selectedPeriod}º Trimestre`
    } else if (config && selectedPeriod === 'total') {
        filterStart = config.trimestre1_inicio
        filterEnd = config.trimestre3_fin
        nombrePeriodo = 'Total Curso'
    }

    // 3. Estadísticas dinámicas
    const { count: totalHoy } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', `${today}T00:00:00.000Z`)
        .lt('fecha', `${today}T23:59:59.999Z`)

    const { count: totalTrimestre } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const { data: pendientesData } = await supabase
        .from('convi_retrasos')
        .select('alumno_id')
        .eq('sancionable', true)
        .is('fecha_sancion', null)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const countAlumnosPendientes = new Set(pendientesData?.map(r => r.alumno_id)).size

    const { count: totalSancionables } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .eq('sancionable', true)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    // 4. Datos para el gráfico de retrasos por curso
    const { data: retrasosPorCursoRaw } = await supabase
        .from('convi_retrasos')
        .select(`
            id,
            alumnos (
                unidad
            )
        `)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const counts: Record<string, number> = {}
    retrasosPorCursoRaw?.forEach((r: any) => {
        const alumno = Array.isArray(r.alumnos) ? r.alumnos[0] : r.alumnos
        const unidad = alumno?.unidad || 'Sin Unidad'
        counts[unidad] = (counts[unidad] || 0) + 1
    })

    const chartData = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15)


    // 6. Estadísticas de justificación para el donut (filtradas por periodo)
    const { count: countJustificados } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .eq('justificante', true)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const totalPeriodo = retrasosPorCursoRaw?.length || 0;
    const countNoJustificados = totalPeriodo - (countJustificados || 0);

    const justificationChartData = [
        { name: 'Justificados', value: countJustificados || 0, color: '#10b981' },
        { name: 'Sin Justificante', value: countNoJustificados, color: '#f59e0b' }
    ]

    const totalSancionablesPeriodo = totalSancionables || 0;
    const totalNoSancionables = totalPeriodo - totalSancionablesPeriodo;

    const sancionableChartData = [
        { name: 'Sancionables', value: totalSancionablesPeriodo, color: '#ef4444' },
        { name: 'No Sancionables', value: totalNoSancionables, color: '#3b82f6' }
    ]

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard de Retrasos</h1>
                    <p className="text-gray-500 mt-1">Análisis y seguimiento de la puntualidad del alumnado.</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/retrasos/historial"
                        className="inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-2xl font-semibold border border-gray-200 hover:border-gray-900 transition-all shadow-sm"
                    >
                        <HistoryIcon className="w-5 h-5" />
                        Historial
                    </a>
                    <a
                        href="/retrasos/crear"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Clock className="w-5 h-5" />
                        Nuevo Retraso
                    </a>
                </div>
            </div>

            <div className="flex justify-end -mt-4">
                <RetrasosFilter currentFilter={selectedPeriod} />
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Hoy</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalHoy || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-indigo-50 p-3.5 rounded-2xl text-indigo-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{nombrePeriodo}</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalTrimestre || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Alumnos Sancionables</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{countAlumnosPendientes || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-rose-50 p-3.5 rounded-2xl text-rose-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Registros Sancionables</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalSancionables || 0}</p>
                    </div>
                </div>
            </div>


            {/* Gráficos en Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Distribución por Unidad */}
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Retrasos por Unidad</h2>
                            <p className="text-sm text-gray-500 font-medium">Distribución por grupos en {nombrePeriodo}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[750px]">
                        <RetrasosCharts data={chartData} yAxisWidth={120} />
                    </div>
                </div>

                {/* Columna de Donutos */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Distribución por Justificación */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Justificación</h2>
                                <p className="text-sm text-gray-500 font-medium">{nombrePeriodo}</p>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                                <PieChartIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <PartesGravityChart data={justificationChartData} />
                        </div>
                    </div>

                    {/* Distribución por Sancionables */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sancionables</h2>
                                <p className="text-sm text-gray-500 font-medium">{nombrePeriodo}</p>
                            </div>
                            <div className="bg-rose-50 p-2.5 rounded-2xl text-rose-600">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <PartesGravityChart data={sancionableChartData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
