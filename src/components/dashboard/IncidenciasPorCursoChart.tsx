'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'

interface IncidenciasPorCursoChartProps {
    data: {
        curso: string
        leves: number
        graves: number
        retrasos: number
        moviles: number
    }[]
}

export default function IncidenciasPorCursoChart({ data }: IncidenciasPorCursoChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                No hay datos suficientes para mostrar el desglose por curso
            </div>
        )
    }

    return (
        <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    barGap={4}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                        dataKey="curso" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        dy={20}
                    />
                    <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <ChartTooltip
                        cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }}
                        contentStyle={{
                            borderRadius: '1.25rem',
                            border: 'none',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                            padding: '16px'
                        }}
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="center" 
                        iconType="circle"
                        wrapperStyle={{ 
                            paddingBottom: '40px', 
                            fontSize: '10px', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em',
                            color: '#4B5563'
                        }}
                    />
                    <Bar 
                        dataKey="leves" 
                        name="P. LEVES" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]} 
                        barSize={12}
                    />
                    <Bar 
                        dataKey="graves" 
                        name="P. GRAVES" 
                        fill="#fbbf24" 
                        radius={[4, 4, 0, 0]} 
                        barSize={12}
                    />
                    <Bar 
                        dataKey="retrasos" 
                        name="RETRASOS" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                        barSize={12}
                    />
                    <Bar 
                        dataKey="moviles" 
                        name="MÓVILES" 
                        fill="#f59e0b" 
                        radius={[4, 4, 0, 0]} 
                        barSize={12}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
