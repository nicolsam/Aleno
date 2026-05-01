'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { getReadingLevelStyle } from '@/lib/reading-levels'
import { buildDashboardActionListHref } from '@/lib/dashboard-action-lists'
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
  improvedCount: number
  improved: { id: string; name: string; studentNumber: string; schoolName: string; level: string; levelCode: string }[]
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
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([])
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

  const handleSchoolFilterChange = (value: string) => {
    const nextSchoolId = value === '__all__' ? '' : value
    setSchoolId(nextSchoolId)
    localStorage.setItem('selectedSchool', nextSchoolId)
    window.dispatchEvent(new Event('schoolChanged'))
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
      const schoolsRes = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const schoolsData = await schoolsRes.json()
      if (schoolsRes.ok && schoolsData.schools) {
        setSchools(schoolsData.schools)
      }

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

  const isCurrent = stats?.monthlyUpdates.monthStatus === 'current'
  const missingUpdatesHref = buildDashboardActionListHref('/dashboard/students/missing-updates', { month: selectedMonth, schoolId, from: 'dashboard' })
  const needAttentionHref = buildDashboardActionListHref('/dashboard/students/need-attention', { month: selectedMonth, schoolId, from: 'dashboard' })
  const improvedHref = buildDashboardActionListHref('/dashboard/students/improved', { month: selectedMonth, schoolId, from: 'dashboard' })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid gap-4 md:flex md:flex-wrap md:items-end">
          <div className="space-y-1 md:w-56">
            <Label className="text-gray-700">{t('classes.school')}</Label>
            <Select value={schoolId || '__all__'} onValueChange={handleSchoolFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('classes.selectSchool')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('classes.all')}</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:w-28">
            <Label className="text-gray-700">{t('dashboard.monthFilter')}</Label>
            <Select value={selectedMonthPart} onValueChange={handleMonthPartChange}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-1 md:w-36">
            <Label className="text-gray-700">{t('classes.academicYear')}</Label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full">
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

      {!stats || stats.totalStudents === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-700">
          {t('dashboard.noData')}
        </div>
      ) : (
        <>

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
            <Button asChild variant="secondary" className="self-start bg-amber-600 text-white hover:bg-amber-700 md:self-auto">
              <Link href={missingUpdatesHref}>
                {t('dashboard.reviewMonthlyUpdates')}
              </Link>
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
        <Link href={improvedHref} data-testid="dashboard-improved-card">
          <div className="bg-white p-6 rounded-lg shadow transition-shadow hover:shadow-md cursor-pointer h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-gray-600 text-sm">{t('dashboard.improvedThisMonth')}</h3>
                <p className="text-3xl font-bold text-green-600" data-testid="dashboard-improved-count">
                  {stats.improvedCount ?? 0}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground mt-1" />
            </div>
          </div>
        </Link>
        <Link href={needAttentionHref} data-testid="dashboard-need-attention-card">
          <div className="bg-white p-6 rounded-lg shadow transition-shadow hover:shadow-md cursor-pointer h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-gray-600 text-sm">{t('dashboard.needAttention')}</h3>
                <p className="text-3xl font-bold text-red-600" data-testid="dashboard-need-attention-count">
                  {stats.needAttention.length}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground mt-1" />
            </div>
          </div>
        </Link>
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
        <Link href={missingUpdatesHref} data-testid="dashboard-missing-updates-card">
          <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.missingMonthlyUpdates')}
                </CardTitle>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600" data-testid="dashboard-missing-updates-count">
                {stats.monthlyUpdates.missingCount}
              </p>
            </CardContent>
          </Card>
        </Link>
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

        </>
      )}
    </div>
  )
}
