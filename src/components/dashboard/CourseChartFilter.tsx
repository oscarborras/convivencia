'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

interface CourseChartFilterProps {
    currentFilter: string
}

export default function CourseChartFilter({ currentFilter }: CourseChartFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleFilterChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('coursePeriod', value)
        // Desplazarse a la gráfica después de filtrar para que el usuario vea el cambio
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const filters = [
        { id: '1', label: '1er Trimestre' },
        { id: '2', label: '2º Trimestre' },
        { id: '3', label: '3er Trimestre' },
        { id: 'total', label: 'Total Curso' }
    ]

    return (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400 border-r border-slate-200 mr-1">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Periodo</span>
            </div>
            <div className="flex items-center gap-1">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => handleFilterChange(f.id)}
                        className={`px-4 py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                            currentFilter === f.id
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-100'
                                : 'text-slate-500 hover:bg-white hover:shadow-sm'
                        }`}
                    >
                        {f.label.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    )
}
