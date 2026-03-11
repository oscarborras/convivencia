import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShieldAlert, Users, Clock, Plus } from 'lucide-react'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

export default async function DashboardPage() {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

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

    // 4. Obtener datos para el gráfico de partes por curso
    // Necesitamos unir partes con alumnos para obtener la unidad (curso)
    const { data: partesPorCursoRaw } = await supabase
        .from('convi_partes')
        .select(`
            id,
            alumnos (
                unidad
            )
        `)

    // Procesar datos para el gráfico
    const counts: Record<string, number> = {}
    partesPorCursoRaw?.forEach((p: any) => {
        const alumno = Array.isArray(p.alumnos) ? p.alumnos[0] : p.alumnos
        const curso = alumno?.unidad || 'Sin Curso'
        // Simplificamos el nombre del curso para el eje X (ej: "1º ESO C" -> "1º ESO")
        const cursoSimplificado = curso.split(' ').slice(0, 2).join(' ')
        counts[cursoSimplificado] = (counts[cursoSimplificado] || 0) + 1
    })

    const chartData = Object.entries(counts)
        .map(([name, partes]) => ({ name, partes }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8) // Limitamos a los 8 principales para que no sature

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

            {/* Gráficos en un componente cliente */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-8">Distribución de Partes por Curso</h2>
                <DashboardCharts data={chartData} />
            </div>
        </div>
    )
}
