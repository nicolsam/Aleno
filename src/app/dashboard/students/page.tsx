'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import StudentsSkeleton from '@/components/skeletons/StudentsSkeleton'
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2 } from "lucide-react"

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
  const t = useTranslations('students')
  const tCommon = useTranslations('common')
  const tLevels = useTranslations('levels')
  const tErrors = useTranslations('errors')
  
  const [students, setStudents] = useState<Student[]>([])
  const [levels, setLevels] = useState<ReadingLevel[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [newStudent, setNewStudent] = useState({ name: '', studentNumber: '', schoolId: '' })
  const [updateLevel, setUpdateLevel] = useState({ studentId: '', readingLevelId: '', notes: '' })
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null)

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
      setError(tErrors('selectSchool'))
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
      setError(data.error || tErrors('failedCreate'))
    }
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    const token = localStorage.getItem('token')
    if (!token) return

    const res = await fetch(`/api/students/${editingStudent.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editingStudent.name, 
        studentNumber: editingStudent.studentNumber,
        schoolId: editingStudent.schoolId
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setStudents(students.map(s => s.id === data.student.id ? { ...data.student, readingHistory: s.readingHistory } : s))
      setEditingStudent(null)
      toast.success(tCommon('save'))
    } else {
      toast.error(tErrors('failedUpdate'))
    }
  }

  const handleDeleteStudent = async () => {
    if (!deletingStudentId) return
    const token = localStorage.getItem('token')
    if (!token) return

    const studentIdToDelete = deletingStudentId
    setDeletingStudentId(null)

    const res = await fetch(`/api/students/${studentIdToDelete}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      const deletedStudent = students.find(s => s.id === studentIdToDelete)
      setStudents(students.filter(s => s.id !== studentIdToDelete))
      
      toast(tCommon('delete'), {
        action: {
          label: tCommon('undo'),
          onClick: async () => {
            const restoreRes = await fetch(`/api/students/${studentIdToDelete}/restore`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` }
            })
            if (restoreRes.ok) {
              if (deletedStudent) setStudents(prev => [...prev, deletedStudent])
            }
          }
        },
        duration: 10000,
      })
    } else {
      toast.error(tErrors('failedDelete'))
    }
  }

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    if (!updateLevel.readingLevelId) {
      setError(tErrors('selectLevel'))
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
      setError(data.error || tErrors('failedUpdate'))
    }
  }

  if (loading) {
    return <StudentsSkeleton />
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700 mb-4">{t('needSchool')}</p>
        <a
          href="/dashboard/schools"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          {tCommon('createSchool')}
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('add')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-gray-700">{t('name')}</th>
              <th className="text-left p-4 text-gray-700">{t('studentNumber')}</th>
              <th className="text-left p-4 text-gray-700">{t('currentLevel')}</th>
              <th className="text-left p-4 text-gray-700">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-700">
                  {t('noStudents')}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-t hover:bg-gray-50 group">
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
                      {student.readingHistory?.[0] ? tLevels(student.readingHistory[0].readingLevel.code) : t('notAssessed')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setUpdateLevel({ studentId: student.id, readingLevelId: '', notes: '' })
                        }}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        {t('updateLevel')}
                      </button>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title={tCommon('edit')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingStudentId(student.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title={tCommon('delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('add')}</h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <select
                value={newStudent.schoolId}
                onChange={(e) => setNewStudent({ ...newStudent, schoolId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectSchool')}</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t('name')}
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                placeholder={t('studentNumber')}
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
                  {tCommon('add')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('editStudent')}</h2>
            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <select
                value={editingStudent.schoolId}
                onChange={(e) => setEditingStudent({ ...editingStudent, schoolId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectSchool')}</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t('name')}
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                placeholder={t('studentNumber')}
                value={editingStudent.studentNumber}
                onChange={(e) => setEditingStudent({ ...editingStudent, studentNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {tCommon('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Level Modal */}
      {updateLevel.studentId && (
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
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {tCommon('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateLevel({ studentId: '', readingLevelId: '', notes: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deletingStudentId} onOpenChange={(open) => !open && setDeletingStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-red-600 hover:bg-red-700">
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}