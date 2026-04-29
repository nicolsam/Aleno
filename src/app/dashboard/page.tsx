'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { getReadingLevelStyle } from '@/lib/reading-levels'
import { ACADEMIC_YEARS } from '@/lib/academic-years'
import {
  buildMonthKey,
  getAvailableMonthOptions,
  getMonthKey,
  getMonthPartFromMonthKey,
  getYearFromMonthKey,
} from '@/lib/monthly-updates'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Stats {
  totalStudents: number
  distribution: { level: string; name: string; count: number; percentage: number }[]
  needAttention: { id: string; name: string; studentNumber: string; schoolName: string; level: string; levelCode: string }[]
  mostCommonLevel: string | null
  improvedThisMonth: number
  monthlyUpdates: {
    month: string
    monthStatus: 'current' | 'past'
    academicYear: number
    totalStudents: number
    updatedCount: number
    missingCount: number
    missingStudents: {
      id: string
      name: string
      studentNumber: string
      schoolName: string
      level: string
      levelCode: string
      latestAssessmentDate: string | null
    }[]
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const t = useTranslations()
  const [stats, setStats] = useState<Stats | null>(null)
  const [schoolId, setSchoolId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey())
  const [selectedYear, setSelectedYear] = useState(String(getYearFromMonthKey(getMonthKey())))
  const [availableAcademicYears, setAvailableAcademicYears] = useState<number[]>(ACADEMIC_YEARS)
  const [loading, setLoading] = useState(true)

  const selectedMonthPart = getMonthPartFromMonthKey(selectedMonth)
  const selectedAcademicYear = Number(selectedYear)
  const availableMonths = getAvailableMonthOptions(selectedAcademicYear)

  const handleMonthPartChange = (month: string) => {
    setSelectedMonth(buildMonthKey(month, selectedYear))
  }

  const handleYearChange = (year: string) => {
    const yearMonths = getAvailableMonthOptions(Number(year))
    const nextMonth = yearMonths.some((month) => month.value === selectedMonthPart)
      ? selectedMonthPart
      : yearMonths.at(-1)?.value || getMonthPartFromMonthKey(getMonthKey())

    setSelectedYear(year)
    setSelectedMonth(buildMonthKey(nextMonth, year))
  }

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

      setLoading(true)
      const classParams = new URLSearchParams()
      if (schoolId) classParams.set('schoolId', schoolId)
      const classUrl = `/api/classes${classParams.toString() ? `?${classParams.toString()}` : ''}`
      const classesRes = await fetch(classUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        const years = classesData.academicYears?.length ? classesData.academicYears : ACADEMIC_YEARS
        setAvailableAcademicYears(years)

        if (years.length > 0 && !years.includes(selectedAcademicYear)) {
          const yearMonths = getAvailableMonthOptions(years[0])
          const nextMonth = yearMonths.some((month) => month.value === selectedMonthPart)
            ? selectedMonthPart
            : yearMonths.at(-1)?.value || getMonthPartFromMonthKey(getMonthKey())

          setSelectedYear(String(years[0]))
          setSelectedMonth(buildMonthKey(nextMonth, years[0]))
          setLoading(false)
          return
        }
      }

      const params = new URLSearchParams({ month: selectedMonth })
      if (schoolId) params.set('schoolId', schoolId)
      const url = `/api/dashboard?${params.toString()}`
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
  }, [schoolId, selectedMonth, selectedAcademicYear, selectedMonthPart])

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

  const isCurrent = stats.monthlyUpdates.monthStatus === 'current'

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label className="text-gray-700">{t('dashboard.monthFilter')}</Label>
            <Select value={selectedMonthPart} onValueChange={handleMonthPartChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('dashboard.monthFilter')} />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-gray-700">{t('classes.academicYear')}</Label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('classes.academicYear')} />
              </SelectTrigger>
              <SelectContent>
                {availableAcademicYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Current month: urgent warning banner */}
      {isCurrent && stats.monthlyUpdates.missingCount > 0 && (
        <Alert variant="warning" className="mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <AlertTitle>{t('dashboard.monthlyUpdateAlertTitle')}</AlertTitle>
              <AlertDescription>
                {t('dashboard.monthlyUpdateAlertDescription', {
                  count: stats.monthlyUpdates.missingCount,
                  month: stats.monthlyUpdates.month,
                })}
              </AlertDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/dashboard/students?month=${stats.monthlyUpdates.month}`)}
              className="self-start bg-amber-600 text-white hover:bg-amber-700 md:self-auto"
            >
              {t('dashboard.reviewMonthlyUpdates')}
            </Button>
          </div>
        </Alert>
      )}

      {/* Past month: neutral informational banner */}
      {!isCurrent && stats.monthlyUpdates.missingCount > 0 && (
        <Alert variant="default" className="mb-6">
          <AlertDescription>
            {t('dashboard.pastMonthInfoDescription', {
              count: stats.monthlyUpdates.missingCount,
              month: stats.monthlyUpdates.month,
            })}
          </AlertDescription>
        </Alert>
      )}

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.updatedThisMonth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.monthlyUpdates.updatedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.missingMonthlyUpdates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.monthlyUpdates.missingCount}</p>
          </CardContent>
        </Card>
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
                  <Cell key={`cell-${index}`} fill={getReadingLevelStyle(stats.distribution[index]?.level).color} />
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
                      <span
                        className="px-2 py-1 rounded text-sm"
                        style={{
                          backgroundColor: getReadingLevelStyle(student.levelCode).backgroundColor,
                          color: getReadingLevelStyle(student.levelCode).textColor,
                        }}
                      >
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

      {stats.monthlyUpdates.missingStudents.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className={`text-lg font-semibold mb-4 ${isCurrent ? 'text-amber-700' : 'text-gray-700'}`}>
            {isCurrent
              ? t('dashboard.studentsMissingMonthlyUpdate')
              : t('dashboard.studentsMissingMonthlyUpdatePast', { month: stats.monthlyUpdates.month })}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-700">{t('students.name')}</th>
                  <th className="text-left py-2 text-gray-700">{t('students.studentNumber')}</th>
                  <th className="text-left py-2 text-gray-700">{t('nav.schools')}</th>
                  <th className="text-left py-2 text-gray-700">{t('students.currentLevel')}</th>
                  <th className="text-left py-2 text-gray-700">{t('students.latestAssessment')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.monthlyUpdates.missingStudents.map((student) => (
                  <tr key={student.id} className="border-b">
                    <td className="py-2 text-gray-800">{student.name}</td>
                    <td className="py-2 text-gray-800">{student.studentNumber}</td>
                    <td className="py-2 text-gray-800">{student.schoolName}</td>
                    <td className="py-2">
                      <span
                        className="px-2 py-1 rounded text-sm"
                        style={{
                          backgroundColor: getReadingLevelStyle(student.levelCode).backgroundColor,
                          color: getReadingLevelStyle(student.levelCode).textColor,
                        }}
                      >
                        {student.levelCode !== 'N/A' ? t(`levels.${student.levelCode}`) : t('students.notAssessed')}
                      </span>
                    </td>
                    <td className="py-2 text-gray-800">
                      {student.latestAssessmentDate
                        ? new Date(student.latestAssessmentDate).toLocaleDateString()
                        : t('students.notAssessed')}
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
