'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, ShieldAlert, Printer, FileBarChart } from 'lucide-react'

interface InformesToolbarProps {
    tipo: 'retrasos' | 'partes'
    period: string
}

const PERIODS = [
    { id: '1', label: '1er Trimestre' },
    { id: '2', label: '2º Trimestre' },
    { id: '3', label: '3er Trimestre' },
    { id: 'total', label: 'Curso Completo' }
]

export default function InformesToolbar({ tipo, period }: InformesToolbarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set(key, value)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="print:hidden space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <FileBarChart className="w-8 h-8 text-primary-brand" />
                        Generar Informe
                    </h1>
                    <p className="text-gray-500 mt-1">Informes en PDF de retrasos y partes por trimestre o curso completo.</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-primary-brand text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-primary-light transition-all shadow-lg shadow-primary-brand/20 active:scale-95"
                >
                    <Printer className="w-5 h-5" />
                    Imprimir / Guardar PDF
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => updateParam('tipo', 'retrasos')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${tipo === 'retrasos'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                            : 'text-slate-500 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Retrasos
                    </button>
                    <button
                        onClick={() => updateParam('tipo', 'partes')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${tipo === 'partes'
                            ? 'bg-red-600 text-white shadow-md shadow-red-100'
                            : 'text-slate-500 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Partes
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => updateParam('period', p.id)}
                            className={`px-4 py-1.5 text-[10px] font-bold rounded-xl transition-all uppercase ${period === p.id
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-slate-500 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
