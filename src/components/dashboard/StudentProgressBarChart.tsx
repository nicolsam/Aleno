'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getReadingLevelStyle } from '@/lib/reading-levels'

type ChartPoint = {
  id: string
  date: string
  level: number
  levelName: string
  code: string
  notes: string | null
}

export default function StudentProgressBarChart({
  data,
  levelLabels,
}: {
  data: ChartPoint[]
  levelLabels: Record<number, string>
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey="id" 
          tickFormatter={(id: string) => {
            const point = data.find(p => p.id === id)
            return point ? point.date : ''
          }}
          tick={{ fontSize: 13, fill: '#6B7280' }} 
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis
          domain={[1, 7]}
          ticks={[1, 2, 3, 4, 5, 6, 7]}
          tickFormatter={(value: number) => levelLabels[value] || ''}
          tick={{ fontSize: 13, fill: '#6B7280' }}
          width={150}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f9fafb' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null

            const point = payload[0].payload as ChartPoint
            const style = getReadingLevelStyle(point.code)
            
            return (
              <div className="rounded-xl border border-gray-100 bg-white/95 p-3 shadow-xl backdrop-blur-sm min-w-[150px]">
                <p className="text-sm text-gray-500 mb-1">{point.date}</p>
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: style.color }} 
                  />
                  <p className="font-semibold text-gray-800">{point.levelName}</p>
                </div>
              </div>
            )
          }}
        />
        <Bar dataKey="level" radius={[4, 4, 0, 0]} maxBarSize={50}>
          {data.map((entry) => (
            <Cell key={`cell-${entry.id}`} fill={getReadingLevelStyle(entry.code).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
