'use client'

import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getReadingLevelStyle } from '@/lib/reading-levels'

type DistributionItem = {
  level: string
  name: string
  count: number
  percentage: number
  translatedName: string
}

export default function DashboardCharts({
  distribution,
  distributionTitle,
  byLevelTitle,
  studentLabel,
}: {
  distribution: DistributionItem[]
  distributionTitle: string
  byLevelTitle: string
  studentLabel: string
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{distributionTitle}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={distribution}
              dataKey="count"
              nameKey="translatedName"
              cx="50%"
              cy="50%"
              outerRadius={100}
            >
              {distribution.map((item) => (
                <Cell key={item.level} fill={getReadingLevelStyle(item.level).color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{byLevelTitle}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distribution} layout="vertical">
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="translatedName" width={120} />
            <Tooltip formatter={(value: any) => [value, studentLabel]} />
            <Legend />
            <Bar dataKey="count" fill="#3B82F6" name={studentLabel} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
