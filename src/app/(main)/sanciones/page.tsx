import { createClient } from '@/lib/supabase/server'
import { Gavel, CalendarClock, Users, FileWarning, History as HistoryIcon, PieChart as PieChartIcon, User, CalendarDays, FileText } from 'lucide-react'
import UnitsBarChart from '@/components/charts/UnitsBarChart'
import PartesGravityChart from '@/components/dashboard/PartesGravityChart'
import PartesFilter from '@/components/dashboard/PartesFilter'

const DAY_MS = 24 * 60 * 60 * 1000

// Días naturales de la sanción (ambos extremos incluidos)
const duracionDias = (inicio: string | null, fin: string | null) =>
    inicio && fin ? Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / DAY_MS) + 1 : null

const formatFecha = (fecha: string | null) =>
    fecha ? new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

export default async function SancionesDashboardPage(props: { searchParams: Promise<{ period?: string }> }) {
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
    let nombrePeriodo = 'Total Curso'

    if (configData && selectedPeriod !== 'total') {
        filterStart = configData[`trimestre${selectedPeriod}_inicio`]
        filterEnd = configData[`trimestre${selectedPeriod}_fin`]
        nombrePeriodo = `${selectedPeriod}º Trimestre`
    } else if (configData && selectedPeriod === 'total') {
        filterStart = configData.trimestre1_inicio
        filterEnd = configData.trimestre3_fin
    }

    // 1. Sanciones impuestas en el periodo
    const { data: sancionesPeriodo } = await supabase
        .from('v_sanciones_detalladas')
        .select('id, alumno_id, alumno, unidad, fecha_sancion, fecha_inicio, fecha_fin, num_partes')
        .gte('fecha_sancion', filterStart)
        .lte('fecha_sancion', filterEnd)

    // 2. Sanciones en curso o próximas (independiente del periodo)
    const { data: sancionesActivas } = await supabase
        .from('v_sanciones_detalladas')
        .select('id, alumno, unidad, fecha_sancion, fecha_inicio, fecha_fin, num_partes')
        .gte('fecha_fin', today)
        .order('fecha_inicio', { ascending: true })

    // 3. Partes del periodo pendientes de sancionar
    const { count: partesPendientes } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .is('fecha_sancion', null)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const sanciones = sancionesPeriodo || []
    const activas = sancionesActivas || []
    const vigentesHoy = activas.filter((s: any) => s.fecha_inicio && s.fecha_inicio <= today).length

    // Procesar datos para gráficos y estadísticas
    const unidadCounts: Record<string, number> = {}
    const alumnoCounts: Record<string, { name: string, unidad: string, sanciones: number, partes: number, dias: number }> = {}
    const estado = { finalizadas: 0, enCurso: 0, proximas: 0, sinFechas: 0 }
    let totalDias = 0
    let sancionesConDias = 0

    sanciones.forEach((s: any) => {
        const unidad = s.unidad || 'Sin Unidad'
        unidadCounts[unidad] = (unidadCounts[unidad] || 0) + 1

        const dias = duracionDias(s.fecha_inicio, s.fecha_fin)
        if (dias !== null) {
            totalDias += dias
            sancionesConDias++
        }

        if (!alumnoCounts[s.alumno_id]) {
            alumnoCounts[s.alumno_id] = { name: s.alumno, unidad, sanciones: 0, partes: 0, dias: 0 }
        }
        alumnoCounts[s.alumno_id].sanciones++
        alumnoCounts[s.alumno_id].partes += s.num_partes || 0
        alumnoCounts[s.alumno_id].dias += dias || 0

        if (!s.fecha_inicio || !s.fecha_fin) estado.sinFechas++
        else if (s.fecha_fin < today) estado.finalizadas++
        else if (s.fecha_inicio > today) estado.proximas++
        else estado.enCurso++
    })

    const chartData = Object.entries(unidadCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

    const alumnoStats = Object.values(alumnoCounts)
        .sort((a, b) => b.sanciones - a.sanciones || b.dias - a.dias)
        .slice(0, 10)

    const estadoChartData = [
        { name: 'Finalizadas', value: estado.finalizadas, color: '#10b981' },
        { name: 'En curso', value: estado.enCurso, color: '#e11d48' },
        { name: 'Próximas', value: estado.proximas, color: '#f59e0b' },
        ...(estado.sinFechas > 0 ? [{ name: 'Sin fechas', value: estado.sinFechas, color: '#94a3b8' }] : []),
    ]

    const mediaDias = sancionesConDias > 0 ? (totalDias / sancionesConDias).toFixed(1) : '—'

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard de Sanciones</h1>
                    <p className="text-gray-500 mt-1">Seguimiento de las sanciones aplicadas a partir de los partes.</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href="/sanciones/historial"
                        className="inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-2xl font-semibold border border-gray-200 hover:border-gray-900 transition-all shadow-sm"
                    >
                        <HistoryIcon className="w-5 h-5" />
                        Historial
                    </a>
                    <a
                        href="/partes/control"
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                    >
                        <Gavel className="w-5 h-5" />
                        Sancionar Partes
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
                        <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
                            <CalendarClock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Vigentes Hoy</p>
                            <p className="text-2xl font-bold">{vigentesHoy}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                            <Gavel className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{nombrePeriodo}</p>
                            <p className="text-2xl font-bold">{sanciones.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Alumnos Sancionados</p>
                            <p className="text-2xl font-bold">{Object.keys(alumnoCounts).length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                            <FileWarning className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Partes sin Sancionar</p>
                            <p className="text-2xl font-bold">{partesPendientes || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Distribución por Unidad */}
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-8 font-display">Sanciones por Unidad</h2>
                    <div className="h-[400px]">
                        <UnitsBarChart data={chartData} yAxisWidth={120} />
                    </div>
                </div>

                {/* Distribución por Estado */}
                <div className="lg:col-span-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Estado</h2>
                            <p className="text-sm text-gray-500 font-medium">Media: {mediaDias} días por sanción</p>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                            <PieChartIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <PartesGravityChart data={estadoChartData} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Sanciones en curso y próximas */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-rose-50 p-2.5 rounded-2xl text-rose-600">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">En Curso y Próximas</h2>
                            <p className="text-sm text-gray-500 font-medium">Sanciones que aún no han finalizado</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Alumno/a</th>
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Inicio</th>
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Fin</th>
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activas.map((s: any) => {
                                    const enCurso = s.fecha_inicio && s.fecha_inicio <= today
                                    return (
                                        <tr key={s.id} className="group hover:bg-rose-50/30 transition-all">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900 text-sm leading-tight">{s.alumno}</p>
                                                <span className="text-[11px] font-bold text-blue-700">{s.unidad}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-medium text-gray-600">{formatFecha(s.fecha_inicio)}</td>
                                            <td className="px-4 py-3 text-center text-sm font-medium text-gray-600">{formatFecha(s.fecha_fin)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${enCurso
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    {enCurso ? 'En curso' : 'Próxima'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {activas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                                            No hay sanciones en curso ni próximas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Alumnos con más sanciones */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Alumnos con más Sanciones</h2>
                            <p className="text-sm text-gray-500 font-medium">En el periodo seleccionado</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Alumno/a</th>
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Partes</th>
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Días</th>
                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Sanciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {alumnoStats.map((a, idx) => (
                                    <tr key={idx} className="group hover:bg-rose-50/30 transition-all cursor-default">
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-gray-900 text-sm leading-tight group-hover:text-rose-700 transition-colors">{a.name}</p>
                                            <span className="text-[11px] font-bold text-blue-700">{a.unidad}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-bold border border-amber-100/50">
                                                <FileText className="w-3.5 h-3.5 text-amber-500" />
                                                {a.partes}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-600">{a.dias}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-sm font-black text-rose-600 bg-rose-50 w-8 h-8 inline-flex items-center justify-center rounded-xl shadow-sm border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                {a.sanciones}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {alumnoStats.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                                            No hay sanciones registradas en este periodo
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
