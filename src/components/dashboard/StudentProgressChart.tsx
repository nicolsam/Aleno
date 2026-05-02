'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ChartPoint = {
  date: string
  level: number
  levelName: string
  notes: string | null
}

export default function StudentProgressChart({
  data,
  levelLabels,
}: {
  data: ChartPoint[]
  levelLabels: Record<number, string>
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
        <YAxis
          domain={[1, 7]}
          ticks={[1, 2, 3, 4, 5, 6, 7]}
          tickFormatter={(value: number) => levelLabels[value] || ''}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          width={130}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null

            const point = payload[0].payload as ChartPoint
            return (
              <div className="rounded-lg border bg-white p-3 shadow-lg">
                <p className="font-semibold text-gray-800">{point.levelName}</p>
                <p className="text-sm text-gray-500">{point.date}</p>
                {point.notes && (
                  <p className="mt-1 text-sm italic text-gray-600">&ldquo;{point.notes}&rdquo;</p>
                )}
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="level"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', r: 5 }}
          activeDot={{ r: 7, fill: '#2563EB' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
