'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { History as HistoryIcon, Search, Calendar, ChevronLeft, ChevronRight, Loader2, User, AlertCircle, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react'
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

interface DetalleRetraso {
    id: string;
    fecha: string;
    justificante: boolean;
    sancionable: boolean;
    observaciones: string;
    fecha_sancion: string | null;
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
    const [selectedAlumnoId, setSelectedAlumnoId] = useState<string | null>(null)
    const [selectedAlumnoName, setSelectedAlumnoName] = useState<string>('')
    const [alumnoDetails, setAlumnoDetails] = useState<DetalleRetraso[]>([])
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [selectedRecords, setSelectedRecords] = useState<string[]>([])
    const [bulkSancionDate, setBulkSancionDate] = useState(new Date().toISOString().split('T')[0])
    const [updatingBulk, setUpdatingBulk] = useState(false)

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

    const fetchAlumnoDetails = useCallback(async (alumnoId: string, alumnoName: string) => {
        if (!config) return
        setSelectedAlumnoId(alumnoId)
        setSelectedAlumnoName(alumnoName)
        setLoadingDetails(true)

        try {
            const startKey = `trimestre${selectedTrimestre}_inicio` as keyof Config
            const endKey = `trimestre${selectedTrimestre}_fin` as keyof Config
            const startDate = config[startKey]
            const endDate = config[endKey]

            const { data, error } = await supabase
                .from('convi_retrasos')
                .select('id, fecha, justificante, sancionable, observaciones, fecha_sancion')
                .eq('alumno_id', alumnoId)
                .gte('fecha', startDate)
                .lte('fecha', endDate)
                .order('fecha', { ascending: false })

            if (error) throw error
            setAlumnoDetails(data || [])
        } catch (error) {
            console.error('Error fetching alumno details:', error)
            toast.error('Error al cargar los detalles del alumno')
        } finally {
            setLoadingDetails(false)
        }
    }, [config, selectedTrimestre, supabase])

    const handleBulkSancion = async () => {
        if (selectedRecords.length === 0) return

        setUpdatingBulk(true)
        try {
            const { error } = await supabase
                .from('convi_retrasos')
                .update({ fecha_sancion: bulkSancionDate })
                .in('id', selectedRecords)

            if (error) throw error

            toast.success(`Se han sancionado ${selectedRecords.length} registros`)
            setSelectedRecords([])
            // Recargar detalles
            if (selectedAlumnoId) {
                fetchAlumnoDetails(selectedAlumnoId, selectedAlumnoName)
            }
            // Recargar tabla principal
            fetchRetrasos()
        } catch (error) {
            console.error('Error in bulk sancion:', error)
            toast.error('Error al aplicar la sanción masiva')
        } finally {
            setUpdatingBulk(false)
        }
    }

    const toggleRecordSelection = (id: string) => {
        setSelectedRecords(prev =>
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        )
    }

    const selectAllRecords = () => {
        if (selectedRecords.length === alumnoDetails.length) {
            setSelectedRecords([])
        } else {
            setSelectedRecords(alumnoDetails.map(d => d.id))
        }
    }


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
                                <HistoryIcon className="w-7 h-7" />
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
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${selectedTrimestre === num
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
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'all'
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
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === 'pending'
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
                                    <tr
                                        key={alu.id}
                                        className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
                                        onClick={() => fetchAlumnoDetails(alu.id, alu.alumno)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2.5 rounded-xl text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{alu.alumno}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{alu.unidad}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100/50">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {alu.justificados}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-bold border border-rose-100/50">
                                                <XCircle className="w-3.5 h-3.5" />
                                                {alu.sin_justificar}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-bold border border-amber-100/50">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {alu.sancionables}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-lg font-black text-indigo-600 bg-indigo-50 w-10 h-10 inline-flex items-center justify-center rounded-2xl shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
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

            {/* Modal de Detalles */}
            {selectedAlumnoId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedAlumnoName}</h2>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedTrimestre}º Trimestre</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAlumnoId(null)}
                                className="p-2.5 rounded-2xl hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Contenido Modal */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto bg-white">
                            {loadingDetails ? (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                    <p className="font-bold text-gray-400">Cargando detalles...</p>
                                </div>
                            ) : alumnoDetails.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Barra de acciones masivas */}
                                    <div className="bg-indigo-50/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 mb-6 sticky top-0 z-10 backdrop-blur-md border border-indigo-100/50">
                                        <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecords.length === alumnoDetails.length && alumnoDetails.length > 0}
                                                onChange={selectAllRecords}
                                                className="w-5 h-5 rounded-lg border-indigo-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-indigo-900">
                                                {selectedRecords.length === 0
                                                    ? 'Ningún seleccionado'
                                                    : `${selectedRecords.length} seleccionados`}
                                            </span>
                                        </div>

                                        {selectedRecords.length > 0 && (
                                            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                                <input
                                                    type="date"
                                                    value={bulkSancionDate}
                                                    onChange={(e) => setBulkSancionDate(e.target.value)}
                                                    className="px-3 py-1.5 rounded-xl border border-indigo-200 text-sm font-bold text-indigo-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                                                />
                                                <button
                                                    onClick={handleBulkSancion}
                                                    disabled={updatingBulk}
                                                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {updatingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar Sanción'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {alumnoDetails.map((detalle) => (
                                        <div
                                            key={detalle.id}
                                            className={`bg-white border rounded-3xl p-5 transition-all group relative flex gap-4 ${selectedRecords.includes(detalle.id)
                                                ? 'border-indigo-400 shadow-lg shadow-indigo-50 ring-2 ring-indigo-500/10 scale-[1.01]'
                                                : 'border-gray-100 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-start pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(detalle.id)}
                                                    onChange={() => toggleRecordSelection(detalle.id)}
                                                    className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl shrink-0">
                                                                <Calendar className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-black text-gray-900 group-hover:text-indigo-700 transition-colors whitespace-nowrap">
                                                                {new Date(detalle.fecha).toLocaleDateString('es-ES', {
                                                                    weekday: 'short',
                                                                    day: 'numeric',
                                                                    month: 'long'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="ml-11 flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400 opacity-60" />
                                                            <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                                                                {new Date(detalle.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 sm:justify-end items-center sm:ml-auto">
                                                        {detalle.justificante ? (
                                                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">Justificado</span>
                                                        ) : (
                                                            <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-100">Sin Justificar</span>
                                                        )}
                                                        {detalle.sancionable && (
                                                            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100">
                                                                Sancionable
                                                            </span>
                                                        )}
                                                        {detalle.fecha_sancion && (
                                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-1.5 shadow-sm">
                                                                <Shield className="w-3 h-3" />
                                                                Sancionado ({new Date(detalle.fecha_sancion).toLocaleDateString('es-ES')})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {detalle.observaciones && (
                                                    <div className="mt-2 bg-gray-50/70 p-4 rounded-2xl text-sm text-gray-700 italic border border-gray-100 leading-relaxed shadow-inner">
                                                        "{detalle.observaciones}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-400">
                                    No hay detalles disponibles para este alumno.
                                </div>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAlumnoId(null)}
                                className="group flex items-center gap-2 bg-white text-gray-600 px-8 py-3 rounded-2xl font-black border border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm hover:shadow-md"
                            >
                                <XCircle className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
