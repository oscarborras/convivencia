import { createClient } from '@/lib/supabase/server'
import { Clock, AlertTriangle, CheckCircle, Calendar, Users, History as HistoryIcon } from 'lucide-react'
import RetrasosCharts from '@/components/retrasos/RetrasosCharts'
import RecentRetrasosTable from '@/components/retrasos/RecentRetrasosTable'

export default async function RetrasosDashboardPage() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // 1. Obtener configuración de trimestres
    const { data: config } = await supabase
        .from('convi_config')
        .select('*')
        .single()

    // 2. Determinar fechas del trimestre actual
    const nowLocal = new Date().toISOString().split('T')[0]
    let startTrimestre = '2000-01-01'
    let endTrimestre = '2100-12-31'
    let nombreTrimestre = 'Curso'

    if (config) {
        if (nowLocal >= config.trimestre1_inicio && nowLocal <= config.trimestre1_fin) {
            startTrimestre = config.trimestre1_inicio
            endTrimestre = config.trimestre1_fin
            nombreTrimestre = '1º Trimestre'
        } else if (nowLocal >= config.trimestre2_inicio && nowLocal <= config.trimestre2_fin) {
            startTrimestre = config.trimestre2_inicio
            endTrimestre = config.trimestre2_fin
            nombreTrimestre = '2º Trimestre'
        } else if (nowLocal >= config.trimestre3_inicio && nowLocal <= config.trimestre3_fin) {
            startTrimestre = config.trimestre3_inicio
            endTrimestre = config.trimestre3_fin
            nombreTrimestre = '3º Trimestre'
        }
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
        .gte('fecha', startTrimestre)
        .lte('fecha', endTrimestre)

    const { data: pendientesData } = await supabase
        .from('convi_retrasos')
        .select('alumno_id')
        .eq('sancionable', true)
        .is('fecha_sancion', null)
        .gte('fecha', startTrimestre)
        .lte('fecha', endTrimestre)

    const countAlumnosPendientes = new Set(pendientesData?.map(r => r.alumno_id)).size

    const { count: totalSancionables } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .eq('sancionable', true)

    // 4. Datos para el gráfico de retrasos por curso
    const { data: retrasosPorCursoRaw } = await supabase
        .from('convi_retrasos')
        .select(`
            id,
            alumnos (
                unidad
            )
        `)

    const counts: Record<string, number> = {}
    retrasosPorCursoRaw?.forEach((r: any) => {
        const alumno = Array.isArray(r.alumnos) ? r.alumnos[0] : r.alumnos
        const unidad = alumno?.unidad || 'Sin Unidad'
        counts[unidad] = (counts[unidad] || 0) + 1
    })

    const chartData = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

    // 5. Últimos 10 retrasos para la tabla
    const { data: recentRetrasos } = await supabase
        .from('convi_retrasos')
        .select(`
            id,
            fecha,
            justificante,
            sancionable,
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard de Retrasos</h1>
                    <p className="text-gray-500 mt-1">Análisis y seguimiento de la puntualidad del alumnado.</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/retrasos/historial"
                        className="inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-2xl font-semibold border border-gray-200 hover:border-gray-900 transition-all shadow-sm"
                    >
                        <HistoryIcon className="w-5 h-5" />
                        Ver Historial
                    </a>
                    <a
                        href="/retrasos/crear"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Clock className="w-5 h-5" />
                        Nuevo Registro
                    </a>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Hoy</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalHoy || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-indigo-50 p-3.5 rounded-2xl text-indigo-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">{nombreTrimestre}</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalTrimestre || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Pendientes Sanción</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Alumnos en {nombreTrimestre}</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{countAlumnosPendientes || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-rose-50 p-3.5 rounded-2xl text-rose-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Sancionables</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalSancionables || 0}</p>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Distribución por Gráfico */}
                <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Retrasos por Unidad</h2>
                    <RetrasosCharts data={chartData} />
                </div>

                {/* Tabla de Recientes */}
                <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Registros Recientes</h2>
                    <RecentRetrasosTable data={recentRetrasos || []} />
                </div>
            </div>
        </div>
    )
}
