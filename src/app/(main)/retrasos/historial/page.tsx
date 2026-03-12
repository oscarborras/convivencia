'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { History, Search, Calendar, ChevronLeft, ChevronRight, Loader2, User, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Config {
    trimestre1_inicio: string;
    trimestre1_fin: string;
    trimestre2_inicio: string;
    trimestre2_fin: string;
    trimestre3_inicio: string;
    trimestre3_fin: string;
}

interface AlumnoRetrasos {
    id: string;
    alumno: string;
    unidad: string;
    total: number;
    justificados: number;
    sin_justificar: number;
    sancionables: number;
}

const ITEMS_PER_PAGE = 10

export default function HistorialRetrasosPage() {
    const [loading, setLoading] = useState(true)
    const [fetchingData, setFetchingData] = useState(false)
    const [config, setConfig] = useState<Config | null>(null)
    const [selectedTrimestre, setSelectedTrimestre] = useState<number>(1)
    const [alumnos, setAlumnos] = useState<AlumnoRetrasos[]>([])
    const [page, setPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('pending')

    const supabase = createClient()

    const fetchConfigAndSetInitialTrimestre = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('convi_config')
                .select('*')
                .single()

            if (error) throw error

            if (data) {
                setConfig(data)
                
                // Determinar trimestre actual
                const today = new Date().toISOString().split('T')[0]
                if (today >= data.trimestre1_inicio && today <= data.trimestre1_fin) {
                    setSelectedTrimestre(1)
                } else if (today >= data.trimestre2_inicio && today <= data.trimestre2_fin) {
                    setSelectedTrimestre(2)
                } else if (today >= data.trimestre3_inicio && today <= data.trimestre3_fin) {
                    setSelectedTrimestre(3)
                } else {
                    // Si no estamos en rango, por defecto T1 o el último activo
                    setSelectedTrimestre(2) // Asumiendo T2 por la fecha actual del sistema
                }
            }
        } catch (error) {
            console.error('Error fetching config:', error)
            toast.error('Error al cargar la configuración de trimestres')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const normalizeText = (text: string) => 
        text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

    const fetchRetrasos = useCallback(async () => {
        if (!config) return
        setFetchingData(true)

        try {
            const startKey = `trimestre${selectedTrimestre}_inicio` as keyof Config
            const endKey = `trimestre${selectedTrimestre}_fin` as keyof Config
            const startDate = config[startKey]
            const endDate = config[endKey]

            if (!startDate || !endDate) {
                setAlumnos([])
                setTotalCount(0)
                return
            }

            // Traemos todos los retrasos del trimestre
            let query = supabase
                .from('convi_retrasos')
                .select(`
                    id,
                    justificante,
                    sancionable,
                    alumno_id,
                    fecha_sancion,
                    alumnos (
                        id,
                        alumno,
                        unidad
                    )
                `)
                .gte('fecha', startDate)
                .lte('fecha', endDate)

            const { data, error } = await query

            if (error) throw error

            if (data) {
                // Filtrado por búsqueda avanzada y estado de sanción
                let filteredData = data;
                
                // 1. Filtro por estado de sanción (pendientes si aplica)
                if (filterStatus === 'pending') {
                    filteredData = filteredData.filter((r: any) => r.fecha_sancion === null);
                }

                // 2. Filtro por búsqueda (acentos, mayúsculas, múltiples palabras)
                if (searchTerm) {
                    const searchWords = normalizeText(searchTerm).split(/\s+/).filter(w => w.length > 0);
                    filteredData = filteredData.filter((r: any) => {
                        if (!r.alumnos?.alumno) return false;
                        const aluName = normalizeText(r.alumnos.alumno);
                        return searchWords.every(word => aluName.includes(word));
                    });
                }

                // Agrupar y contar por alumno
                const groupedMap: Record<string, AlumnoRetrasos> = {}
                
                filteredData.forEach((r: any) => {
                    const alu = r.alumnos
                    if (!alu) return
                    
                    if (!groupedMap[alu.id]) {
                        groupedMap[alu.id] = {
                            id: alu.id,
                            alumno: alu.alumno,
                            unidad: alu.unidad || 'Sin curso',
                            total: 0,
                            justificados: 0,
                            sin_justificar: 0,
                            sancionables: 0
                        }
                    }
                    
                    groupedMap[alu.id].total++
                    if (r.justificante) groupedMap[alu.id].justificados++
                    else groupedMap[alu.id].sin_justificar++
                    if (r.sancionable) groupedMap[alu.id].sancionables++
                })

                const sortedAlumnos = Object.values(groupedMap).sort((a, b) => b.total - a.total)
                
                // Aplicar paginación manual
                setTotalCount(sortedAlumnos.length)
                const start = (page - 1) * ITEMS_PER_PAGE
                const paginated = sortedAlumnos.slice(start, start + ITEMS_PER_PAGE)
                
                setAlumnos(paginated)
            }
        } catch (error) {
            console.error('Error fetching retrasos:', error)
            toast.error('Error al cargar el historial de retrasos')
        } finally {
            setFetchingData(false)
        }
    }, [config, selectedTrimestre, page, searchTerm, filterStatus, supabase])


    useEffect(() => {
        fetchConfigAndSetInitialTrimestre()
    }, [fetchConfigAndSetInitialTrimestre])

    useEffect(() => {
        if (config) {
            fetchRetrasos()
        }
    }, [config, selectedTrimestre, page, searchTerm, filterStatus, fetchRetrasos])

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="bg-white rounded-3xl p-8 border-t-4 border-indigo-500 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600">
                                <History className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Historial de Retrasos</h1>
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed max-w-xl">
                            Consulta el recuento de retrasos por alumno segmentado por trimestre y estado de justificación.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 flex">
                            {[1, 2, 3].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setSelectedTrimestre(num)
                                        setPage(1)
                                    }}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                        selectedTrimestre === num
                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-100'
                                            : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    {num}º Trim
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Decoración */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Filtros de búsqueda y estado */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre de alumno..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setPage(1)
                        }}
                        className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-700 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 min-w-[240px]">
                    <button
                        onClick={() => {
                            setFilterStatus('all')
                            setPage(1)
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterStatus === 'all'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]'
                                : 'text-gray-500 hover:text-gray-900 border-transparent'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => {
                            setFilterStatus('pending')
                            setPage(1)
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterStatus === 'pending'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-100 scale-[1.02]'
                                : 'text-gray-500 hover:text-gray-900 border-transparent'
                        }`}
                    >
                        Pendientes Sanción
                    </button>
                </div>
            </div>

            {/* Tabla de resultados */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Alumno/a</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Curso</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Justificados</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Sin Justificar</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Sancionables</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {fetchingData ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
                                        Actualizando datos...
                                    </td>
                                </tr>
                            ) : alumnos.length > 0 ? (
                                alumnos.map((alu) => (
                                    <tr key={alu.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-xl text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-gray-900">{alu.alumno}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{alu.unidad}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {alu.justificados}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-bold">
                                                <XCircle className="w-3.5 h-3.5" />
                                                {alu.sin_justificar}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {alu.sancionables}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-lg font-black text-indigo-600 bg-indigo-50 w-10 h-10 inline-flex items-center justify-center rounded-2xl shadow-sm border border-indigo-100">
                                                {alu.total}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No se encontraron retrasos para este trimestre o criterio de búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500 font-medium">
                            Mostrando <span className="font-bold text-gray-900">{((page - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-bold text-gray-900">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> de <span className="font-bold text-gray-900">{totalCount}</span> alumnos
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-50 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold px-4 text-gray-900">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-50 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
