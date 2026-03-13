'use client'

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface RecentRetrasosTableProps {
    data: any[]
}

export default function RecentRetrasosTable({ data }: RecentRetrasosTableProps) {
    if (data.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                No se han registrado retrasos recientemente.
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
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Fecha</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Just.</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 text-[11px] text-center uppercase tracking-wider">Sanc.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((retraso) => {
                        const alumno = Array.isArray(retraso.alumnos) ? retraso.alumnos[0] : retraso.alumnos
                        return (
                            <tr key={retraso.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-2.5 px-4">
                                    <p className="font-semibold text-gray-900 text-xs line-clamp-1">{alumno?.alumno || 'Desconocido'}</p>
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
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
