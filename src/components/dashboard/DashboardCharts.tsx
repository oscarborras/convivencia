'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

interface DashboardChartsProps {
    data: { name: string; partes: number }[]
}

const COLORS = [
    'var(--chart-1, #2563eb)',
    'var(--chart-2, #3b82f6)',
    'var(--chart-3, #60a5fa)',
    'var(--chart-4, #93c5fd)',
    'var(--chart-5, #bfdbfe)',
]

export default function DashboardCharts({ data }: DashboardChartsProps) {
    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                No hay datos disponibles para mostrar
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                    <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#374151', fontWeight: 500, fontSize: 13 }}
                        width={100}
                    />
                    <ChartTooltip
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{
                            borderRadius: '1.25rem',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px 16px'
                        }}
                    />
                    <Bar
                        dataKey="partes"
                        radius={[0, 12, 12, 0]}
                        barSize={32}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
