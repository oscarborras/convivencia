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
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="pb-4 font-semibold text-gray-600 text-sm">Alumno/a</th>
                        <th className="pb-4 font-semibold text-gray-600 text-sm hidden sm:table-cell">Curso</th>
                        <th className="pb-4 font-semibold text-gray-600 text-sm">Fecha</th>
                        <th className="pb-4 font-semibold text-gray-600 text-sm text-center">Just.</th>
                        <th className="pb-4 font-semibold text-gray-600 text-sm text-center">Sanc.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((retraso) => {
                        const alumno = Array.isArray(retraso.alumnos) ? retraso.alumnos[0] : retraso.alumnos
                        return (
                            <tr key={retraso.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-4">
                                    <p className="font-semibold text-gray-900 line-clamp-1">{alumno?.alumno || 'Desconocido'}</p>
                                </td>
                                <td className="py-4 hidden sm:table-cell">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        {alumno?.unidad || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 text-sm text-gray-600">
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {new Date(retraso.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(retraso.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex justify-center">
                                        {retraso.justificante ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-gray-300" />
                                        )}
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex justify-center">
                                        {retraso.sancionable ? (
                                            <AlertCircle className="w-5 h-5 text-orange-500" />
                                        ) : (
                                            <CheckCircle2 className="w-5 h-5 text-gray-200" />
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
