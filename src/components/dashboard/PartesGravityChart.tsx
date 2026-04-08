'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts'

interface PartesGravityChartProps {
    data: {
        name: string
        value: number
        color: string
    }[]
    total?: number
}

export default function PartesGravityChart({ data, total: totalProp }: PartesGravityChartProps) {
    const total = totalProp ?? data.reduce((acc, curr) => acc + curr.value, 0)
    const sum = data.reduce((acc, curr) => acc + curr.value, 0)

    if (total === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                No hay datos de partes registrados
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Centro del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-gray-900 leading-none">{total}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total</span>
                </div>
            </div>

            {/* Leyenda personalizada estilo la captura */}
            <div className="mt-6 space-y-3 px-2">
                {data.map((item, index) => {
                    const percentage = sum > 0 ? Math.round((item.value / sum) * 100) : 0
                    return (
                        <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm font-bold text-gray-600 transition-colors group-hover:text-gray-900">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-sm font-black text-gray-900">
                                {percentage}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
