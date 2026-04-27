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
    LabelList,
} from 'recharts'

interface UnitsBarChartProps {
    data: { name: string; value: number }[]
    yAxisWidth?: number
    height?: number
}

const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
]

export default function UnitsBarChart({ data, yAxisWidth = 90, height = 400 }: UnitsBarChartProps) {
    if (data.length === 0) {
        return (
            <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                Sin datos suficientes
            </div>
        )
    }

    return (
        <div style={{ height: `${height}px` }} className="w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
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
                        width={yAxisWidth}
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
                        dataKey="value"
                        radius={[0, 12, 12, 0]}
                        barSize={32}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <LabelList
                            dataKey="value"
                            position="right"
                            fill="#6B7280"
                            fontSize={13}
                            fontWeight={600}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
