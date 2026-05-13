'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, User, Calendar, Clock, Shield, X, Info, Mail } from 'lucide-react'

type EmailResult = { email: string; label: string; ok: boolean }

function emailStatus(results: EmailResult[] | null | undefined) {
    if (results === null || results === undefined) return 'none' as const
    if (results.length === 0) return 'empty' as const
    if (results.every(r => r.ok)) return 'ok' as const
    if (results.some(r => r.ok)) return 'partial' as const
    return 'error' as const
}

function EmailStatusIcon({ results }: { results: EmailResult[] | null | undefined }) {
    const s = emailStatus(results)
    if (s === 'none')    return <span className="text-gray-200 text-base leading-none">·</span>
    if (s === 'empty')   return <span className="text-gray-400 text-xs font-bold">—</span>
    if (s === 'ok')      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (s === 'partial') return <AlertCircle  className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
}

interface RecentRetrasosTableProps {
    data: any[]
}

export default function RecentRetrasosTable({ data }: RecentRetrasosTableProps) {
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null)

    if (data.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                No se han registrado retrasos recientemente.
            </div>
        )
    }

    return (
        <>
        <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Alumno/a</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] hidden sm:table-cell uppercase tracking-wider">Curso</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Fecha</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Just.</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Sanc.</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Email</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((retraso) => {
                        const alumno = Array.isArray(retraso.alumnos) ? retraso.alumnos[0] : retraso.alumnos
                        return (
                            <tr
                                key={retraso.id}
                                className="group hover:bg-indigo-50/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedRecord(retraso)}
                            >
                                <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-xl text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="font-semibold text-gray-900 text-xs line-clamp-1 group-hover:text-indigo-700 transition-colors">
                                            {alumno?.alumno || 'Desconocido'}
                                        </p>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 hidden sm:table-cell">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                                        {alumno?.unidad || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-xs text-gray-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-[11px]">
                                            {new Date(retraso.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(retraso.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4">
                                    <div className="flex justify-center">
                                        {retraso.justificante ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-gray-300" />
                                        )}
                                    </div>
                                </td>
                                <td className="py-2.5 px-4">
                                    <div className="flex justify-center">
                                        {retraso.sancionable ? (
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-gray-200" />
                                        )}
                                    </div>
                                </td>
                                <td className="py-2.5 px-4">
                                    <div className="flex justify-center">
                                        <EmailStatusIcon results={retraso.email_results} />
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Modal de Detalle */}
        </div>

        {/* Leyenda columna Email */}
        <div className="flex flex-wrap justify-end items-center gap-x-4 gap-y-1 pt-3 w-full text-[10px] text-gray-400">
            <span className="font-black uppercase tracking-widest">Email:</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Todos OK</span>
            <span className="flex items-center gap-1"><AlertCircle  className="w-3.5 h-3.5 text-amber-500" /> Parcial</span>
            <span className="flex items-center gap-1"><XCircle      className="w-3.5 h-3.5 text-red-500"   /> Todos fallaron</span>
            <span className="flex items-center gap-1"><span className="font-bold text-xs w-3.5 text-center">—</span> Sin destinatarios</span>
            <span className="flex items-center gap-1"><span className="font-bold text-gray-300 text-base leading-none w-3.5 text-center">·</span> Sin datos</span>
        </div>

        {selectedRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-indigo-50 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 bg-indigo-50/30 border-b border-indigo-100/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Detalle de Retraso</h2>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Información completa de la BD</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="p-2.5 rounded-2xl hover:bg-white text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6 overflow-y-auto">
                            {/* Alumno Info */}
                            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                                    <User className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg leading-tight">
                                        {(Array.isArray(selectedRecord.alumnos) ? selectedRecord.alumnos[0] : selectedRecord.alumnos)?.alumno || 'Desconocido'}
                                    </h3>
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                        {(Array.isArray(selectedRecord.alumnos) ? selectedRecord.alumnos[0] : selectedRecord.alumnos)?.unidad || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Grid Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Fecha</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {new Date(selectedRecord.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Hora</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {new Date(selectedRecord.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-3">
                                {selectedRecord.justificante ? (
                                    <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Justificado
                                    </span>
                                ) : (
                                    <span className="bg-gray-50 text-gray-500 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-gray-100 flex items-center gap-2">
                                        <XCircle className="w-4 h-4" /> Sin Justificar
                                    </span>
                                )}
                                {selectedRecord.sancionable && (
                                    <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-amber-100 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Sancionable
                                    </span>
                                )}
                                {selectedRecord.fecha_sancion && (
                                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-2 shadow-sm">
                                        <Shield className="w-4 h-4" /> Sancionado ({new Date(selectedRecord.fecha_sancion).toLocaleDateString('es-ES')})
                                    </span>
                                )}
                            </div>

                            {/* Envío de Notificaciones */}
                            <div className="bg-gray-50/80 p-5 rounded-[2rem] border border-gray-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Envío de Notificaciones</p>
                                </div>
                                {selectedRecord.email_results === null || selectedRecord.email_results === undefined ? (
                                    <p className="text-xs text-gray-400 italic px-1">Sin datos (registro anterior a esta funcionalidad)</p>
                                ) : selectedRecord.email_results.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic px-1">Sin destinatarios configurados</p>
                                ) : (
                                    <div className="space-y-2">
                                        {(selectedRecord.email_results as EmailResult[]).map((r, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm">
                                                <div className="flex items-center gap-2.5">
                                                    {r.ok
                                                        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                        : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    }
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700">{r.label}</p>
                                                        <p className="text-[10px] text-gray-400">{r.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${r.ok ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    {r.ok ? 'OK' : 'Error'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Observaciones */}
                            {selectedRecord.observaciones && (
                                <div className="bg-gray-50/80 p-5 rounded-[2rem] border border-gray-100 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Observaciones</p>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                                            "{selectedRecord.observaciones}"
                                        </p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Info className="w-8 h-8 text-indigo-600" />
                                    </div>
                                </div>
                            )}

                            {/* Registro Meta */}
                            {selectedRecord.registrado_por && (
                                <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-100 mt-4">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">ID: {selectedRecord.id.substring(0, 8)}...</span>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        <Shield className="w-3 h-3 text-indigo-400" />
                                        <span className="text-[10px] font-bold text-gray-500 italic">Reg: {selectedRecord.registrado_por}</span>
                                    </div>
                                </div>
                            )}
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
