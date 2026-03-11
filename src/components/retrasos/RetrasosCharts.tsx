'use client'

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as ChartTooltip,
    Legend
} from 'recharts'

interface RetrasosChartsProps {
    data: { name: string; value: number }[]
}

const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
]

export default function RetrasosCharts({ data }: RetrasosChartsProps) {
    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400 italic">
                Sin datos suficientes
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <ChartTooltip
                        contentStyle={{
                            borderRadius: '1rem',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-sm font-medium text-gray-600">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
