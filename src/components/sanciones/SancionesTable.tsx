'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, X, Info, User, Calendar, CalendarClock, CalendarCheck, Shield, Gavel, FileText, Clock } from 'lucide-react'

interface ParteSancion {
    id: string
    fecha: string
    hora: string | null
    conductas_contrarias: string[] | null
    conductas_graves: string[] | null
    genera_expulsion: boolean
    observaciones: string | null
    profesor: string | null
}

interface Sancion {
    id: string
    alumno: string
    unidad: string
    fecha_sancion: string
    fecha_inicio: string | null
    fecha_fin: string | null
    observaciones: string | null
    registrado_por: string | null
    num_partes: number
    partes: ParteSancion[]
}

interface SancionesTableProps {
    data: Sancion[]
}

const DAY_MS = 24 * 60 * 60 * 1000

const duracionDias = (inicio: string | null, fin: string | null) =>
    inicio && fin ? Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / DAY_MS) + 1 : null

const formatCorta = (fecha: string | null) =>
    fecha ? new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

const formatLarga = (fecha: string | null) =>
    fecha ? new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'No indicada'

function estadoSancion(s: Sancion) {
    const today = new Date().toISOString().split('T')[0]
    if (!s.fecha_inicio || !s.fecha_fin) return { label: 'Sin fechas', className: 'bg-gray-50 text-gray-500 border-gray-200' }
    if (s.fecha_fin < today) return { label: 'Finalizada', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    if (s.fecha_inicio > today) return { label: 'Próxima', className: 'bg-amber-50 text-amber-700 border-amber-100' }
    return { label: 'En curso', className: 'bg-rose-50 text-rose-700 border-rose-100' }
}

export default function SancionesTable({ data }: SancionesTableProps) {
    const [selectedRecord, setSelectedRecord] = useState<Sancion | null>(null)

    if (data.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                No se han registrado sanciones.
            </div>
        )
    }

    const selectedDias = selectedRecord ? duracionDias(selectedRecord.fecha_inicio, selectedRecord.fecha_fin) : null
    const selectedEstado = selectedRecord ? estadoSancion(selectedRecord) : null

    return (
        <>
        <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Alumno/a</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] hidden sm:table-cell uppercase tracking-wider">Curso</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Fecha</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Periodo</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider hidden md:table-cell">Partes</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((sancion) => {
                        const estado = estadoSancion(sancion)
                        return (
                            <tr
                                key={sancion.id}
                                className="group hover:bg-rose-50/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedRecord(sancion)}
                            >
                                <td className="py-2 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-xl text-gray-500 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="font-semibold text-[13px] text-gray-900 line-clamp-1 group-hover:text-rose-700 transition-colors">
                                            {sancion.alumno || 'Desconocido'}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-2 px-4 hidden sm:table-cell">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                                        {sancion.unidad || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-2 px-4 text-center text-[12px] font-medium text-gray-600">
                                    {formatCorta(sancion.fecha_sancion)}
                                </td>
                                <td className="py-2 px-4 text-center text-[12px] font-medium text-gray-600 whitespace-nowrap">
                                    {sancion.fecha_inicio ? `${formatCorta(sancion.fecha_inicio)} – ${formatCorta(sancion.fecha_fin)}` : '—'}
                                </td>
                                <td className="py-2 px-4 text-center hidden md:table-cell">
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-100/50">
                                        <FileText className="w-3 h-3" />
                                        {sancion.num_partes}
                                    </span>
                                </td>
                                <td className="py-2 px-4 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${estado.className}`}>
                                        {estado.label}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>

        {selectedRecord && selectedEstado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-rose-50 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 bg-rose-50/30 border-b border-rose-100/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-lg shadow-rose-100">
                                    <Gavel className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Detalle de la Sanción</h2>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Información completa de la BD</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2.5 rounded-2xl hover:bg-white text-gray-400 hover:text-rose-600 transition-all shadow-sm border border-transparent hover:border-rose-100"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6 overflow-y-auto">
                            {/* Alumno Info */}
                            <div className="flex items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                                        <User className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight">{selectedRecord.alumno || 'Desconocido'}</h3>
                                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{selectedRecord.unidad || 'N/A'}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${selectedEstado.className}`}>
                                    {selectedEstado.label}
                                </span>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1 sm:col-span-2">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Fecha de la Sanción</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{formatLarga(selectedRecord.fecha_sancion)}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <CalendarClock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Inicio de Efecto</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{formatLarga(selectedRecord.fecha_inicio)}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <CalendarCheck className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Fin de la Sanción</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{formatLarga(selectedRecord.fecha_fin)}</p>
                                </div>
                            </div>

                            {selectedDias !== null && (
                                <div className="flex flex-wrap gap-3">
                                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-2 shadow-sm">
                                        <Clock className="w-4 h-4" /> {selectedDias} {selectedDias === 1 ? 'día' : 'días'} naturales
                                    </span>
                                </div>
                            )}

                            {/* Observaciones */}
                            {selectedRecord.observaciones && (
                                <div className="bg-gray-50/80 p-5 rounded-[2rem] border border-gray-100 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Observaciones</p>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed italic whitespace-pre-line">
                                            &quot;{selectedRecord.observaciones}&quot;
                                        </p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Info className="w-8 h-8 text-rose-600" />
                                    </div>
                                </div>
                            )}

                            {/* Partes asociados */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                                    Partes Sancionados ({selectedRecord.num_partes})
                                </p>
                                {selectedRecord.partes.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic px-1">No hay partes asociados a esta sanción</p>
                                ) : selectedRecord.partes.map((parte) => (
                                    <div key={parte.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5 text-rose-400" />
                                                <span className="font-bold text-gray-900 text-sm">
                                                    {new Date(parte.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold">{parte.hora?.substring(0, 5) || '--:--'}</span>
                                            </div>
                                            {parte.genera_expulsion && (
                                                <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Expulsión</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-500 italic">{parte.profesor || 'Profesor desconocido'}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {parte.conductas_contrarias?.map((c, i) => (
                                                <span key={`c${i}`} className="inline-flex items-start gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-amber-100 leading-tight">
                                                    <AlertTriangle className="w-3 h-3 shrink-0" /> {c}
                                                </span>
                                            ))}
                                            {parte.conductas_graves?.map((c, i) => (
                                                <span key={`g${i}`} className="inline-flex items-start gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-red-100 leading-tight">
                                                    <AlertCircle className="w-3 h-3 shrink-0" /> {c}
                                                </span>
                                            ))}
                                        </div>
                                        {parte.observaciones && (
                                            <p className="text-xs text-gray-600 italic bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                                                &quot;{parte.observaciones}&quot;
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Registro Meta */}
                            <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-100 mt-4 shrink-0">
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {selectedRecord.id.substring(0, 8)}...</span>
                                {selectedRecord.registrado_por && (
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        <Shield className="w-3 h-3 text-rose-400" />
                                        <span className="text-[10px] font-bold text-gray-500 italic">Reg: {selectedRecord.registrado_por}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="bg-white text-gray-900 px-8 py-3 rounded-2xl font-black text-sm border border-gray-200 hover:border-gray-900 transition-all shadow-sm active:scale-95"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
