import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldAlert, Users, Clock, Plus, BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react'
import IncidenciasEvolutionChart from '@/components/dashboard/IncidenciasEvolutionChart'
import IncidenciasPorCursoChart from '@/components/dashboard/IncidenciasPorCursoChart'
import CourseChartFilter from '@/components/dashboard/CourseChartFilter'

export default async function DashboardPage(props: { searchParams: Promise<{ coursePeriod?: string }> }) {
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

    const selectedPeriod = searchParams.coursePeriod || currentT

    // 1. Obtener partes de hoy
    const { count: countPartesHoy } = await supabase
        .from('convi_partes')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today)

    // 2. Obtener alumnos implicados hoy (únicos en partes)
    const { data: alumnosPartesHoy } = await supabase
        .from('convi_partes')
        .select('alumno_id')
        .eq('fecha', today)

    const uniqueAlumnosHoy = new Set(alumnosPartesHoy?.map(p => p.alumno_id) || []).size

    // 3. Obtener retrasos de hoy (la fecha guarda timestamp ISO completo)
    const { count: countRetrasosHoy } = await supabase
        .from('convi_retrasos')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', `${today}T00:00:00.000Z`)
        .lt('fecha', `${today}T23:59:59.999Z`)

    // 4. Obtener datos para el gráfico de evolución (desde septiembre)
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed (0=Jan, 8=Sep)

    // El año académico empieza en septiembre. 
    // Si estamos en meses 0-7 (Ene-Ago), el año de inicio es el anterior.
    const academicStartYear = currentMonth < 8 ? currentYear - 1 : currentYear
    const startDateEvolution = `${academicStartYear}-09-01`

    const [{ data: evolutionPartes }, { data: evolutionRetrasos }] = await Promise.all([
        supabase.from('convi_partes')
            .select('fecha, conductas_contrarias, conductas_graves, genera_expulsion, alumnos(unidad)')
            .gte('fecha', startDateEvolution),
        supabase.from('convi_retrasos')
            .select('fecha, alumnos(unidad)')
            .gte('fecha', startDateEvolution)
    ])

    // Procesar meses desde septiembre hasta hoy
    const monthsNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const evolutionMap: any[] = []

    let tempDate = new Date(academicStartYear, 8, 1)
    while (tempDate <= now) {
        evolutionMap.push({
            label: monthsNames[tempDate.getMonth()],
            month: tempDate.getMonth(),
            year: tempDate.getFullYear(),
            partes: 0,
            retrasos: 0,
            moviles: 0
        })
        tempDate.setMonth(tempDate.getMonth() + 1)
    }

    const CONDUCTA_MOVIL = "Usar móviles, aparatos electrónicos y similares sin permiso";

    evolutionPartes?.forEach(p => {
        const d = new Date(p.fecha)
        const item = evolutionMap.find(ed => ed.month === d.getMonth() && ed.year === d.getFullYear())
        if (item) {
            item.partes++
            const hasMovil = (p.conductas_contrarias?.includes(CONDUCTA_MOVIL)) || (p.conductas_graves?.includes(CONDUCTA_MOVIL))
            if (hasMovil) item.moviles++
        }
    })

    evolutionRetrasos?.forEach(r => {
        const d = new Date(r.fecha)
        const item = evolutionMap.find(ed => ed.month === d.getMonth() && ed.year === d.getFullYear())
        if (item) item.retrasos++
    })

    const finalChartData = evolutionMap.map(ed => ({
        month: ed.label,
        partes: ed.partes,
        retrasos: ed.retrasos,
        moviles: ed.moviles
    }))


    // 6. Procesar datos por curso (Filtrados por periodo seleccionado)
    const cursoMap: Record<string, any> = {}

    // Definir límites de fecha para el filtro de curso
    let filterStart: Date | null = null
    let filterEnd: Date | null = null

    if (configData && selectedPeriod !== 'total') {
        filterStart = new Date(configData[`trimestre${selectedPeriod}_inicio`])
        filterEnd = new Date(configData[`trimestre${selectedPeriod}_fin`])
    }

    const normalizeCurso = (unidad: string) => {
        if (!unidad) return 'Sin Curso'
        // Si el formato es "1º ESO A", nos quedamos con "1º ESO"
        // Dividimos por espacios y quitamos el último elemento si es una sola letra
        const parts = unidad.split(' ')
        if (parts.length > 1 && parts[parts.length - 1].length === 1) {
            return parts.slice(0, -1).join(' ')
        }
        return unidad
    }

    evolutionPartes?.forEach(p => {
        const d = new Date(p.fecha)
        if (filterStart && filterEnd && (d < filterStart || d > filterEnd)) return

        const alumno = Array.isArray(p.alumnos) ? p.alumnos[0] : p.alumnos
        const unidadRaw = alumno?.unidad || 'Sin Curso'
        const unidad = normalizeCurso(unidadRaw)

        if (!cursoMap[unidad]) {
            cursoMap[unidad] = { curso: unidad, leves: 0, graves: 0, retrasos: 0, moviles: 0 }
        }

        const hasGrave = p.conductas_graves && p.conductas_graves.length > 0
        const hasLeve = p.conductas_contrarias && p.conductas_contrarias.length > 0
        const hasMovil = (p.conductas_contrarias?.includes(CONDUCTA_MOVIL)) || (p.conductas_graves?.includes(CONDUCTA_MOVIL))

        if (hasGrave) cursoMap[unidad].graves++
        else if (hasLeve) cursoMap[unidad].leves++

        if (hasMovil) cursoMap[unidad].moviles++
    })

    evolutionRetrasos?.forEach(r => {
        const d = new Date(r.fecha)
        if (filterStart && filterEnd && (d < filterStart || d > filterEnd)) return

        const alumno = Array.isArray(r.alumnos) ? r.alumnos[0] : r.alumnos
        const unidadRaw = alumno?.unidad || 'Sin Curso'
        const unidad = normalizeCurso(unidadRaw)

        if (!cursoMap[unidad]) {
            cursoMap[unidad] = { curso: unidad, leves: 0, graves: 0, retrasos: 0, moviles: 0 }
        }
        cursoMap[unidad].retrasos++
    })

    const courseChartData = Object.values(cursoMap)
        .sort((a: any, b: any) => a.curso.localeCompare(b.curso))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Resumen de Convivencia</h1>
                <div className="flex items-center gap-3">
                    <Link
                        href="/partes/crear"
                        className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Nuevo Parte
                    </Link>
                    <Link
                        href="/retrasos/crear"
                        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
                    >
                        <Clock className="w-4 h-4" />
                        Nuevo Retraso
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Tarjetas de Resumen Dinámicas */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-red-50 p-4 rounded-2xl text-red-600">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Partes Hoy</p>
                        <p className="text-3xl font-bold text-gray-900">{countPartesHoy || 0}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Alumnos Implicados</p>
                        <p className="text-3xl font-bold text-gray-900">{uniqueAlumnosHoy}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="bg-orange-50 p-4 rounded-2xl text-orange-600">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Retrasos Hoy</p>
                        <p className="text-3xl font-bold text-gray-900">{countRetrasosHoy || 0}</p>
                    </div>
                </div>
            </div>

            {/* Gráficos en Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
                {/* Gráfico de Evolución */}
                <div className="lg:col-span-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Evolución de Incidencias</h2>
                                <p className="text-sm text-gray-500 font-medium">Comparativa General (Mensual)</p>
                            </div>
                            <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <IncidenciasEvolutionChart data={finalChartData} />
                    </div>
                </div>
            </div>

            {/* Nueva Gráfica por Curso */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Análisis por Cursos</h2>
                            <p className="text-sm text-gray-500 font-medium">Comparativa de incidencias por nivel educativo</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <CourseChartFilter currentFilter={selectedPeriod} />
                            <div className="bg-amber-50 p-2.5 rounded-2xl text-amber-600 hidden sm:block">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <IncidenciasPorCursoChart data={courseChartData} />
                </div>
            </div>
        </div>
    )
}
