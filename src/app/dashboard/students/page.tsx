'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Student {
  id: string
  name: string
  studentNumber: string
  schoolId: string
  readingHistory: {
    id: string
    readingLevel: { name: string; code: string }
  }[]
}

interface ReadingLevel {
  id: string
  code: string
  name: string
  order: number
}

interface School {
  id: string
  name: string
}

export default function StudentsPage() {
  const router = useRouter()
  const t = useTranslations()
  const [students, setStudents] = useState<Student[]>([])
  const [levels, setLevels] = useState<ReadingLevel[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [newStudent, setNewStudent] = useState({ name: '', studentNumber: '', schoolId: '' })
  const [updateLevel, setUpdateLevel] = useState({ studentId: '', readingLevelId: '', notes: '' })

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
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      const schoolsRes = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const schoolsData = await schoolsRes.json()
      if (schoolsRes.ok && schoolsData.schools) {
        setSchools(schoolsData.schools)
      }

      const url = schoolId ? `/api/students?schoolId=${schoolId}` : '/api/students'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.students) {
        setStudents(data.students)
      }

      const levelsRes = await fetch('/api/levels')
      if (levelsRes.ok) {
        const levelsData = await levelsRes.json()
        setLevels(levelsData)
      }
      setLoading(false)
    }
    fetchData()
  }, [schoolId])

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token || !newStudent.schoolId) {
      setError(t('errors.selectSchool'))
      return
    }

    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    })

    if (res.ok) {
      const data = await res.json()
      setStudents([...students, { ...data.student, readingHistory: data.student.readingHistory || [] }])
      setShowModal(false)
      setNewStudent({ name: '', studentNumber: '', schoolId: '' })
    } else {
      const data = await res.json()
      setError(data.error || t('errors.failedCreate'))
    }
  }

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    if (!updateLevel.readingLevelId) {
      setError(t('errors.selectLevel'))
      return
    }

    const res = await fetch('/api/students/update', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updateLevel),
    })

    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json()
      setError(data.error || t('errors.failedUpdate'))
    }
  }

  if (loading) {
    return <div className="text-gray-700">{t('common.loading')}</div>
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700 mb-4">{t('students.needSchool')}</p>
        <a
          href="/dashboard/schools"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          {t('common.createSchool')}
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('students.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('students.add')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-gray-700">{t('students.name')}</th>
              <th className="text-left p-4 text-gray-700">{t('students.studentNumber')}</th>
              <th className="text-left p-4 text-gray-700">{t('students.currentLevel')}</th>
              <th className="text-left p-4 text-gray-700">{t('students.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-700">
                  {t('students.noStudents')}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="p-4 text-gray-800">{student.name}</td>
                  <td className="p-4 text-gray-800">{student.studentNumber}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        ['DNI', 'LO'].includes(student.readingHistory?.[0]?.readingLevel.code)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {student.readingHistory?.[0] ? t(`levels.${student.readingHistory[0].readingLevel.code}`) : t('students.notAssessed')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setUpdateLevel({ studentId: student.id, readingLevelId: '', notes: '' })
                      }}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {t('students.updateLevel')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('students.add')}</h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <select
                value={newStudent.schoolId}
                onChange={(e) => setNewStudent({ ...newStudent, schoolId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('students.selectSchool')}</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t('students.name')}
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                placeholder={t('students.studentNumber')}
                value={newStudent.studentNumber}
                onChange={(e) => setNewStudent({ ...newStudent, studentNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t('common.add')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateLevel.studentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('students.updateLevel')}</h2>
            <form onSubmit={handleUpdateLevel} className="space-y-4">
              <select
                value={updateLevel.readingLevelId}
                onChange={(e) => setUpdateLevel({ ...updateLevel, readingLevelId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('levels.selectLevel')}</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {t(`levels.${level.code}`)}
                  </option>
                ))}
              </select>
              <textarea
                placeholder={t('students.notes')}
                value={updateLevel.notes}
                onChange={(e) => setUpdateLevel({ ...updateLevel, notes: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateLevel({ studentId: '', readingLevelId: '', notes: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}