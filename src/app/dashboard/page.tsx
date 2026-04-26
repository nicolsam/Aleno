'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'

interface Stats {
  totalStudents: number
  distribution: { level: string; name: string; count: number; percentage: number }[]
  needAttention: { id: string; name: string; studentNumber: string; schoolName: string; level: string; levelCode: string }[]
  mostCommonLevel: string | null
  improvedThisMonth: number
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E', '#14B8A6', '#06B6D4']

export default function DashboardPage() {
  const router = useRouter()
  const t = useTranslations()
  const [stats, setStats] = useState<Stats | null>(null)
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    const handleSchoolChange = () => {
      const storedSchool = localStorage.getItem('selectedSchool')
      setSchoolId(storedSchool || '')
    }

    handleSchoolChange()
    window.addEventListener('schoolChanged', handleSchoolChange)
    return () => window.removeEventListener('schoolChanged', handleSchoolChange)
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
    return <DashboardSkeleton />
  }

  if (!stats || stats.totalStudents === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.title')}</h1>
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-700">
          {t('dashboard.noData')}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">{t('dashboard.totalStudents')}</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">{t('dashboard.mostCommonLevel')}</h3>
          <p className="text-2xl font-bold text-gray-800">
            {stats.mostCommonLevel ? t(`levels.${stats.mostCommonLevel}`) : '-'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">{t('dashboard.improvedThisMonth')}</h3>
          <p className="text-3xl font-bold text-green-600">{stats.improvedThisMonth}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">{t('dashboard.needAttention')}</h3>
          <p className="text-3xl font-bold text-red-600">{stats.needAttention.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.distribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.distribution.map(d => ({ ...d, translatedName: t(`levels.${d.level}`) }))}
                dataKey="count"
                nameKey="translatedName"
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('dashboard.byLevel')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.distribution.map(d => ({ ...d, translatedName: t(`levels.${d.level}`) }))} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="translatedName" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name={t('nav.students')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.needAttention.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-red-600 mb-4">{t('dashboard.studentsAttention')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-700">{t('students.name')}</th>
                  <th className="text-left py-2 text-gray-700">{t('students.studentNumber')}</th>
                  <th className="text-left py-2 text-gray-700">{t('nav.schools')}</th>
                  <th className="text-left py-2 text-gray-700">{t('students.currentLevel')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.needAttention.map((student) => (
                  <tr key={student.id} className="border-b">
                    <td className="py-2 text-gray-800">{student.name}</td>
                    <td className="py-2 text-gray-800">{student.studentNumber}</td>
                    <td className="py-2 text-gray-800">{student.schoolName}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        {student.levelCode !== 'N/A' ? t(`levels.${student.levelCode}`) : t('students.notAssessed')}
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