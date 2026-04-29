'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ACADEMIC_YEARS } from '@/lib/academic-years'
import {
  buildMonthKey,
  getAvailableMonthOptions,
  getMonthKey,
  getMonthPartFromMonthKey,
  getYearFromMonthKey,
  resolveMonthKey,
} from '@/lib/monthly-updates'
import { getReadingLevelStyle } from '@/lib/reading-levels'

type ActionListKind = 'need-attention' | 'missing-updates'

interface School {
  id: string
  name: string
}

interface AttentionStudent {
  id: string
  name: string
  studentNumber: string
  schoolName: string
  levelCode: string
}

interface MissingUpdateStudent extends AttentionStudent {
  latestAssessmentDate: string | null
}

interface DashboardStats {
  needAttention: AttentionStudent[]
  monthlyUpdates: {
    month: string
    missingStudents: MissingUpdateStudent[]
  }
}

interface DashboardActionListPageProps {
  kind: ActionListKind
  initialMonth?: string
  initialSchoolId?: string
  from?: string
}

export default function DashboardActionListPage({
  kind,
  initialMonth,
  initialSchoolId = '',
  from,
}: DashboardActionListPageProps) {
  const router = useRouter()
  const t = useTranslations()
  const initialResolvedMonth = resolveMonthKey(initialMonth)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState(initialSchoolId)
  const [selectedMonth, setSelectedMonth] = useState(initialResolvedMonth)
  const [selectedYear, setSelectedYear] = useState(String(getYearFromMonthKey(initialResolvedMonth)))
  const [availableAcademicYears, setAvailableAcademicYears] = useState<number[]>(ACADEMIC_YEARS)
  const [loading, setLoading] = useState(true)

  const selectedMonthPart = getMonthPartFromMonthKey(selectedMonth)
  const selectedAcademicYear = Number(selectedYear)
  const availableMonths = getAvailableMonthOptions(selectedAcademicYear)
  const isNeedAttention = kind === 'need-attention'
  const title = isNeedAttention
    ? t('dashboard.studentsAttention')
    : t('dashboard.studentsMissingMonthlyUpdate')
  const emptyMessage = isNeedAttention
    ? t('dashboard.noStudentsNeedAttention')
    : t('dashboard.noStudentsMissingMonthlyUpdate')

  const backHref = from === 'dashboard' ? '/dashboard' : '/dashboard/students'
  const backLabel = from === 'dashboard' ? t('dashboard.backToDashboard') : t('students.backToStudents')

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

    const fetchData = async () => {
      setLoading(true)

      const schoolsRes = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json()
        setSchools(schoolsData.schools || [])
      }

      const classParams = new URLSearchParams()
      if (schoolId) classParams.set('schoolId', schoolId)
      const classesRes = await fetch(`/api/classes${classParams.toString() ? `?${classParams.toString()}` : ''}`, {
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

      const dashboardParams = new URLSearchParams({ month: selectedMonth })
      if (schoolId) dashboardParams.set('schoolId', schoolId)
      const dashboardRes = await fetch(`/api/dashboard?${dashboardParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (dashboardRes.ok) {
        setStats(await dashboardRes.json())
      }

      setLoading(false)
    }

    fetchData()
  }, [router, schoolId, selectedMonth, selectedAcademicYear, selectedMonthPart])

  const students = isNeedAttention
    ? stats?.needAttention || []
    : stats?.monthlyUpdates.missingStudents || []
  const getLatestAssessmentDate = (student: AttentionStudent | MissingUpdateStudent) => (
    isNeedAttention ? null : (student as MissingUpdateStudent).latestAssessmentDate
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="link" className="mb-2 h-auto p-0 text-blue-600">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:flex md:flex-wrap md:items-end">
            <div className="space-y-1 md:w-56">
              <Label>{t('classes.school')}</Label>
              <Select value={schoolId || '__all__'} onValueChange={(value) => setSchoolId(value === '__all__' ? '' : value)}>
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
              <Label>{t('dashboard.monthFilter')}</Label>
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
              <Label>{t('classes.academicYear')}</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-700">{emptyMessage}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left p-4 text-gray-700">{t('students.name')}</th>
                    <th className="text-left p-4 text-gray-700">{t('students.studentNumber')}</th>
                    <th className="text-left p-4 text-gray-700">{t('nav.schools')}</th>
                    <th className="text-left p-4 text-gray-700">{t('students.currentLevel')}</th>
                    {!isNeedAttention && (
                      <th className="text-left p-4 text-gray-700">{t('students.latestAssessment')}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{student.name}</td>
                      <td className="p-4 text-gray-800">{student.studentNumber}</td>
                      <td className="p-4 text-gray-800">{student.schoolName}</td>
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded text-sm"
                          style={{
                            backgroundColor: getReadingLevelStyle(student.levelCode).backgroundColor,
                            color: getReadingLevelStyle(student.levelCode).textColor,
                          }}
                        >
                          {student.levelCode !== 'N/A'
                            ? t(`levels.${student.levelCode}`)
                            : t('students.notAssessed')}
                        </span>
                      </td>
                      {!isNeedAttention && (
                        <td className="p-4 text-gray-800">
                          {getLatestAssessmentDate(student)
                            ? new Date(getLatestAssessmentDate(student)!).toLocaleDateString()
                            : t('students.notAssessed')}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
