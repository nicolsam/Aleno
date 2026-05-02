'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft, TrendingUp, User, BookOpen } from 'lucide-react'
import { getReadingLevelStyle } from '@/lib/reading-levels'
import { getDefaultAssessmentDateForMonth, getMonthKey } from '@/lib/monthly-updates'
import StudentProfileSkeleton from '@/components/skeletons/StudentProfileSkeleton'
import { cachedJson, clearClientGetCache } from '@/lib/client-get-cache'

const StudentProgressChart = dynamic(() => import('@/components/dashboard/StudentProgressChart'), {
  loading: () => <div className="h-[280px] animate-pulse rounded bg-gray-50" />,
})

interface ClassRecord {
  id: string
  grade: string
  section: string
  shift: string
  academicYear: number
}

interface HistoryEntry {
  id: string
  recordedAt: string
  notes: string | null
  readingLevel: { code: string; name: string; order: number }
  teacher: { name: string }
}

interface StudentDetail {
  id: string
  name: string
  studentNumber: string
  class: ClassRecord
  school: { id: string; name: string }
}

interface ReadingLevel {
  id: string
  code: string
  name: string
  order: number
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const t = useTranslations('students')
  const tClasses = useTranslations('classes')
  const tCommon = useTranslations('common')
  const tLevels = useTranslations('levels')
  const tErrors = useTranslations('errors')
  const locale = useLocale()

  const [studentId, setStudentId] = useState<string>('')
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [levels, setLevels] = useState<ReadingLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateLevel, setUpdateLevel] = useState({
    readingLevelId: '',
    notes: '',
    recordedAt: getDefaultAssessmentDateForMonth(getMonthKey()),
  })
  const maxAssessmentDate = getDefaultAssessmentDateForMonth(getMonthKey())

  useEffect(() => {
    params.then(p => setStudentId(p.id))
  }, [params])

  useEffect(() => {
    if (!studentId) return
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      const [historyRes, levelsRes] = await Promise.all([
        cachedJson<{ student: StudentDetail; history: HistoryEntry[] }>(`/api/students/${studentId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        cachedJson<ReadingLevel[]>('/api/levels'),
      ])

      if (historyRes.ok) {
        setStudent(historyRes.data.student)
        setHistory(historyRes.data.history)
      }

      if (levelsRes.ok) {
        setLevels(levelsRes.data)
      }

      setLoading(false)
    }
    fetchData()
  }, [studentId, router])

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token || !updateLevel.readingLevelId) return

    const res = await fetch('/api/students/update', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, ...updateLevel }),
    })

    if (res.ok) {
      clearClientGetCache(`/api/students/${studentId}/history`)
      // Re-fetch data to show the new entry
      const historyRes = await cachedJson<{ student: StudentDetail; history: HistoryEntry[] }>(`/api/students/${studentId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      }, { force: true })
      if (historyRes.ok) {
        setStudent(historyRes.data.student)
        setHistory(historyRes.data.history)
      }
      setShowUpdateModal(false)
      setUpdateLevel({
        readingLevelId: '',
        notes: '',
        recordedAt: getDefaultAssessmentDateForMonth(getMonthKey()),
      })
    }
  }

  const formatClassName = (c?: ClassRecord) => {
    if (!c) return 'N/A'
    return `${c.grade} ${c.section} (${tClasses(`shifts.${c.shift}`)}) - ${c.academicYear}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const currentLevel = history.length > 0 ? history[0] : null

  // Chart data: reverse history so it goes chronologically left-to-right
  const chartData = [...history].reverse().map(entry => ({
    date: new Date(entry.recordedAt).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
    }),
    level: entry.readingLevel.order,
    levelName: tLevels(entry.readingLevel.code),
    notes: entry.notes,
  }))

  // Y-axis tick formatter: map order numbers to level codes
  const levelLabels: Record<number, string> = {
    1: tLevels('DNI'),
    2: tLevels('LO'),
    3: tLevels('SO'),
    4: tLevels('RW'),
    5: tLevels('RS'),
    6: tLevels('RTS'),
    7: tLevels('RTF'),
  }

  if (loading) {
    return <StudentProfileSkeleton />
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700">{tErrors('internalError')}</p>
        <Link href="/dashboard/students" className="text-blue-600 hover:underline mt-2 inline-block">
          {t('backToStudents')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        {t('backToStudents')}
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
              <p className="text-gray-500 text-sm">#{student.studentNumber}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>{t('school')}: <strong>{student.school.name}</strong></span>
                <span>{tClasses('class')}: <strong>{formatClassName(student.class)}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {currentLevel ? (
              <span
                className="px-3 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: getReadingLevelStyle(currentLevel.readingLevel.code).backgroundColor,
                  color: getReadingLevelStyle(currentLevel.readingLevel.code).textColor,
                }}
              >
                {tLevels(currentLevel.readingLevel.code)}
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-500">
                {t('notAssessed')}
              </span>
            )}
            <button
              onClick={() => setShowUpdateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {t('updateLevel')}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">{t('progressChart')}</h2>
          </div>
          <StudentProgressChart data={chartData} levelLabels={levelLabels} />
        </div>
      )}

      {/* History Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">{t('readingHistory')}</h2>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('noHistory')}</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2.5 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: getReadingLevelStyle(entry.readingLevel.code).color, top: '6px' }}
                  />

                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: getReadingLevelStyle(entry.readingLevel.code).backgroundColor,
                          color: getReadingLevelStyle(entry.readingLevel.code).textColor,
                        }}
                      >
                        {tLevels(entry.readingLevel.code)}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(entry.recordedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('recordedBy')} <strong>{entry.teacher.name}</strong>
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-700 mt-2 bg-white rounded p-2 border border-gray-100 italic">
                        &ldquo;{entry.notes}&rdquo;
                      </p>
                    )}
                    {index === 0 && (
                      <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {t('currentLevel')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Update Level Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('updateLevel')}</h2>
            <form onSubmit={handleUpdateLevel} className="space-y-4">
              <select
                value={updateLevel.readingLevelId}
                onChange={(e) => setUpdateLevel({ ...updateLevel, readingLevelId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{tLevels('selectLevel')}</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {tLevels(level.code)}
                  </option>
                ))}
              </select>
              <textarea
                placeholder={t('notes')}
                value={updateLevel.notes}
                onChange={(e) => setUpdateLevel({ ...updateLevel, notes: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
              />
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('assessmentDate')}</label>
                <input
                  type="date"
                  value={updateLevel.recordedAt}
                  max={maxAssessmentDate}
                  onChange={(e) => setUpdateLevel({ ...updateLevel, recordedAt: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {tCommon('save')}
                </button>
                <button type="button" onClick={() => setShowUpdateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded">
                  {tCommon('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
