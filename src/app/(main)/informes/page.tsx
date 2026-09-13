import { createClient } from '@/lib/supabase/server'
import {
    Clock,
    AlertTriangle,
    Calendar,
    Users,
    ShieldAlert,
    PieChart as PieChartIcon,
    AlertOctagon,
    FileText
} from 'lucide-react'
import UnitsBarChart from '@/components/charts/UnitsBarChart'
import PartesGravityChart from '@/components/dashboard/PartesGravityChart'
import InformesToolbar from './InformesToolbar'

type Tipo = 'retrasos' | 'partes'

const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

export default async function InformesPage(props: { searchParams: Promise<{ tipo?: string; period?: string }> }) {
    const searchParams = await props.searchParams
    const tipo: Tipo = searchParams.tipo === 'partes' ? 'partes' : 'retrasos'

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()

    // 1. Configuración de trimestres
    const { data: config } = await supabase.from('convi_config').select('*').single()

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
    } else if (config) {
        filterStart = config.trimestre1_inicio
        filterEnd = config.trimestre3_fin
        nombrePeriodo = 'Total Curso'
    }

    const rangoLabel = config ? `${formatFecha(filterStart)} — ${formatFecha(filterEnd)}` : ''
    const generadoLabel = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

    return (
        <div className="space-y-8 pb-12">
            <InformesToolbar tipo={tipo} period={selectedPeriod} />

            <style>{`@page { size: A4; margin: 1.2cm; }`}</style>

            {/* Cabecera del informe (visible en pantalla e impresión) */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 print:shadow-none print:border-0 print:rounded-none print:p-0 print:pb-4 print:border-b-2 print:border-slate-900 print:break-inside-avoid">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Informe de Convivencia</p>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {tipo === 'retrasos' ? 'Retrasos' : 'Partes de Incidencia'}
                        </h2>
                        <p className="text-gray-500 font-medium mt-1">{nombrePeriodo} · {rangoLabel}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Generado el {generadoLabel}
                    </p>
                </div>
            </div>

            {tipo === 'retrasos'
                ? <RetrasosInforme filterStart={filterStart} filterEnd={filterEnd} nombrePeriodo={nombrePeriodo} today={today} />
                : <PartesInforme filterStart={filterStart} filterEnd={filterEnd} today={today} />}
        </div>
    )
}

async function RetrasosInforme({ filterStart, filterEnd, nombrePeriodo, today }: { filterStart: string; filterEnd: string; nombrePeriodo: string; today: string }) {
    const supabase = await createClient()

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

    const { count: countJustificados } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .eq('justificante', true)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const totalPeriodo = retrasosPorCursoRaw?.length || 0
    const countNoJustificados = totalPeriodo - (countJustificados || 0)

    const justificationChartData = [
        { name: 'Justificados', value: countJustificados || 0, color: '#10b981' },
        { name: 'Sin Justificante', value: countNoJustificados, color: '#f59e0b' }
    ]

    const totalSancionablesPeriodo = totalSancionables || 0
    const totalNoSancionables = totalPeriodo - totalSancionablesPeriodo

    const sancionableChartData = [
        { name: 'Sancionables', value: totalSancionablesPeriodo, color: '#ef4444' },
        { name: 'No Sancionables', value: totalNoSancionables, color: '#3b82f6' }
    ]

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4 print:break-inside-avoid">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 print:border print:shadow-none print:rounded-xl">
                    <div className="bg-blue-50 p-3.5 rounded-2xl text-blue-600 print:hidden">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Hoy</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalHoy || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 print:border print:shadow-none print:rounded-xl">
                    <div className="bg-indigo-50 p-3.5 rounded-2xl text-indigo-600 print:hidden">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{nombrePeriodo}</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalTrimestre || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 print:border print:shadow-none print:rounded-xl">
                    <div className="bg-amber-50 p-3.5 rounded-2xl text-amber-600 print:hidden">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Alumnos Sancionables</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{countAlumnosPendientes || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 print:border print:shadow-none print:rounded-xl">
                    <div className="bg-rose-50 p-3.5 rounded-2xl text-rose-600 print:hidden">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Registros Sancionables</p>
                        <p className="text-2xl font-black text-gray-900 leading-none">{totalSancionables || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:break-inside-avoid">
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col print:border print:shadow-none">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Retrasos por Unidad</h2>
                            <p className="text-sm text-gray-500 font-medium">Todas las unidades · {nombrePeriodo}</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[750px]">
                        <UnitsBarChart data={chartData} yAxisWidth={120} height={Math.max(400, chartData.length * 40)} />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col print:border print:shadow-none print:break-inside-avoid">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Justificación</h2>
                                <p className="text-sm text-gray-500 font-medium">{nombrePeriodo}</p>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600 print:hidden">
                                <PieChartIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <PartesGravityChart data={justificationChartData} />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col print:border print:shadow-none print:break-inside-avoid">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sancionables</h2>
                                <p className="text-sm text-gray-500 font-medium">{nombrePeriodo}</p>
                            </div>
                            <div className="bg-rose-50 p-2.5 rounded-2xl text-rose-600 print:hidden">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <PartesGravityChart data={sancionableChartData} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

async function PartesInforme({ filterStart, filterEnd, today }: { filterStart: string; filterEnd: string; today: string }) {
    const supabase = await createClient()

    const { count: totalHoy } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today)

    const { count: totalPartesLeves } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .neq('conductas_contrarias', '{}')
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const { count: totalPartesGraves } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .neq('conductas_graves', '{}')
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const { data: partesPeriodo } = await supabase
        .from('convi_partes')
        .select(`
            conductas_contrarias,
            conductas_graves,
            alumnos (unidad)
        `)
        .gte('fecha', filterStart)
        .lte('fecha', filterEnd)

    const unidadCounts: Record<string, number> = {}
    partesPeriodo?.forEach((r: any) => {
        const unidad = (Array.isArray(r.alumnos) ? r.alumnos[0] : r.alumnos)?.unidad || 'Sin Unidad'
        unidadCounts[unidad] = (unidadCounts[unidad] || 0) + 1
    })

    const chartData = Object.entries(unidadCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    const gravityChartData = [
        { name: 'Leves', value: totalPartesLeves || 0, color: '#10b981' },
        { name: 'Graves', value: totalPartesGraves || 0, color: '#f59e0b' }
    ]

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4 print:break-inside-avoid">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 print:border print:shadow-none print:rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 print:hidden">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Hoy</p>
                            <p className="text-2xl font-bold">{totalHoy || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 print:border print:shadow-none print:rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-50 p-3 rounded-2xl text-purple-600 print:hidden">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Periodo</p>
                            <p className="text-2xl font-bold">{partesPeriodo?.length || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 print:border print:shadow-none print:rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 print:hidden">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Conductas Leves</p>
                            <p className="text-2xl font-bold">{totalPartesLeves || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 print:border print:shadow-none print:rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 p-3 rounded-2xl text-red-600 print:hidden">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Conductas Graves</p>
                            <p className="text-2xl font-bold">{totalPartesGraves || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:break-inside-avoid">
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 print:border print:shadow-none">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 font-display">Partes por Unidad</h2>
                            <p className="text-sm text-gray-500 font-medium">Todas las unidades / cursos</p>
                        </div>
                        <div className="bg-red-50 p-2.5 rounded-2xl text-red-600 print:hidden">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div style={{ height: `${Math.max(400, chartData.length * 40)}px` }}>
                        <UnitsBarChart data={chartData} yAxisWidth={120} height={Math.max(400, chartData.length * 40)} />
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col print:border print:shadow-none print:break-inside-avoid">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tipos de Conductas</h2>
                            <p className="text-sm text-gray-500 font-medium">Distribución por Gravedad</p>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600 print:hidden">
                            <PieChartIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <PartesGravityChart data={gravityChartData} />
                    </div>
                </div>
            </div>
        </>
    )
}
