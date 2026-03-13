'use client'

import { AlertCircle, AlertTriangle } from 'lucide-react'

interface RecentPartesTableProps {
    data: any[]
}

export default function RecentPartesTable({ data }: RecentPartesTableProps) {
    if (data.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                No se han registrado partes disciplinarios recientemente.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Alumno/a</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] hidden sm:table-cell uppercase tracking-wider">Curso</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] w-32 text-center uppercase tracking-wider">Fecha</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Motivo Principal</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Exp.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((parte) => {
                        const alumno = Array.isArray(parte.alumnos) ? parte.alumnos[0] : parte.alumnos

                        // Pick the most relevant/first reason to show in the table
                        let motivoPrincipal = "Sin especificar";
                        let isGrave = false;
                        if (parte.conductas_graves && parte.conductas_graves.length > 0) {
                            motivoPrincipal = parte.conductas_graves[0];
                            isGrave = true;
                        } else if (parte.conductas_contrarias && parte.conductas_contrarias.length > 0) {
                            motivoPrincipal = parte.conductas_contrarias[0];
                        }

                        return (
                            <tr key={parte.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-2 px-4">
                                    <p className="font-semibold text-[13px] text-gray-900 line-clamp-1">{alumno?.alumno || 'Desconocido'}</p>
                                </td>
                                <td className="py-2 px-4 hidden sm:table-cell">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                                        {alumno?.unidad || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-2 px-4 text-[13px] text-gray-600">
                                    <div className="flex flex-col items-center text-center">
                                        <span className="font-medium text-[12px]">
                                            {new Date(parte.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                                            {parte.hora}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2 px-4 pr-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isGrave ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                        {isGrave ? <AlertCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                        <span className="truncate max-w-[220px]" title={motivoPrincipal}>{motivoPrincipal}</span>
                                    </span>
                                </td>
                                <td className="py-2 px-4">
                                    <div className="flex justify-center">
                                        {parte.genera_expulsion ? (
                                            <span className="bg-red-600 text-white p-1 rounded-full"><AlertCircle className="w-3.5 h-3.5" /></span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
