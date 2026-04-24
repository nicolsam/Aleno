'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Stats {
  totalStudents: number
  distribution: { level: string; name: string; count: number; percentage: number }[]
  needAttention: { id: string; name: string; studentNumber: string; schoolName: string; level: string; levelCode: string }[]
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4']

interface DashboardLayout {
  children: React.ReactNode
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const storedSchool = localStorage.getItem('selectedSchool')
    setSchoolId(storedSchool || '')
  }, [router])

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      const url = schoolId ? `/api/dashboard?schoolId=${schoolId}` : '/api/dashboard'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
      setLoading(false)
    }
    fetchStats()
  }, [schoolId])

  if (loading) {
    return <div className="text-gray-700">Loading...</div>
  }

  if (!stats || stats.totalStudents === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-700">
          No students yet. Add students to see statistics.
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Students</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Average Level</h3>
          <p className="text-3xl font-bold text-gray-800">
            {stats.distribution.reduce((acc, d) => acc + d.count * (8 - stats.distribution.indexOf(d)), 0) / stats.totalStudents || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Need Attention</h3>
          <p className="text-3xl font-bold text-red-600">{stats.needAttention.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution by Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.distribution}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {stats.distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Students by Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.distribution} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="level" width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.needAttention.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Students Need Attention</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Student #</th>
                  <th className="text-left py-2">School</th>
                  <th className="text-left py-2">Level</th>
                </tr>
              </thead>
              <tbody>
                {stats.needAttention.map((student) => (
                  <tr key={student.id} className="border-b">
                    <td className="py-2">{student.name}</td>
                    <td className="py-2">{student.studentNumber}</td>
                    <td className="py-2">{student.schoolName}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        {student.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}