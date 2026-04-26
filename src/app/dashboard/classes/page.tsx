'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

interface School {
  id: string
  name: string
}

interface ClassRecord {
  id: string
  grade: string
  section: string
  shift: string
  schoolId: string
  school: School
}

const VALID_SHIFTS = ['Morning', 'Afternoon', 'Night']
const VALID_GRADES = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano', '1ª Série', '2ª Série', '3ª Série']

export default function ClassesPage() {
  const router = useRouter()
  const t = useTranslations('classes')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newClass, setNewClass] = useState({ grade: '', section: '', shift: '', schoolId: '' })
  
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null)
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)

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

      const url = schoolId ? `/api/classes?schoolId=${schoolId}` : '/api/classes'
      const classesRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const classesData = await classesRes.json()
      if (classesRes.ok && classesData.classes) {
        setClasses(classesData.classes)
      }
      setLoading(false)
    }
    fetchData()
  }, [schoolId])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newClass),
    })

    if (res.ok) {
      const data = await res.json()
      setClasses([...classes, data.class])
      setShowModal(false)
      setNewClass({ grade: '', section: '', shift: '', schoolId: '' })
      toast.success(tCommon('save'))
    } else {
      const data = await res.json()
      toast.error(data.error || tErrors('failedUpdate'))
    }
  }

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClass) return
    const token = localStorage.getItem('token')
    if (!token) return

    const res = await fetch(`/api/classes/${editingClass.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        grade: editingClass.grade, 
        section: editingClass.section,
        shift: editingClass.shift
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setClasses(classes.map(c => c.id === data.class.id ? data.class : c))
      setEditingClass(null)
      toast.success(tCommon('save'))
    } else {
      const data = await res.json()
      toast.error(data.error || tErrors('failedUpdate'))
    }
  }

  const handleDeleteClass = async () => {
    if (!deletingClassId) return
    const token = localStorage.getItem('token')
    if (!token) return

    const classIdToDelete = deletingClassId
    setDeletingClassId(null)

    const res = await fetch(`/api/classes/${classIdToDelete}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      const deletedClass = classes.find(c => c.id === classIdToDelete)
      setClasses(classes.filter(c => c.id !== classIdToDelete))
      
      toast(tCommon('delete'), {
        action: {
          label: tCommon('undo'),
          onClick: async () => {
            const restoreRes = await fetch(`/api/classes/${classIdToDelete}/restore`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` }
            })
            if (restoreRes.ok) {
              if (deletedClass) setClasses(prev => [...prev, deletedClass])
            }
          }
        },
        duration: 10000,
      })
    } else {
      toast.error(tErrors('failedDelete'))
    }
  }

  if (loading) {
    return <div className="p-8 text-center">{tCommon('loading')}...</div>
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700 mb-4">{t('needSchool')}</p>
        <a href="/dashboard/schools" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block">
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-gray-700">{t('grade')}</th>
              <th className="text-left p-4 text-gray-700">{t('section')}</th>
              <th className="text-left p-4 text-gray-700">{t('shift')}</th>
              <th className="text-left p-4 text-gray-700">{t('school')}</th>
              <th className="text-left p-4 text-gray-700">{tCommon('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-700">
                  {t('noClasses')}
                </td>
              </tr>
            ) : (
              classes.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50 group">
                  <td className="p-4 text-gray-800">{c.grade}</td>
                  <td className="p-4 text-gray-800">{c.section}</td>
                  <td className="p-4 text-gray-800">{t(`shifts.${c.shift}`)}</td>
                  <td className="p-4 text-gray-800">{c.school?.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingClass(c)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title={tCommon('edit')}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingClassId(c.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title={tCommon('delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('add')}</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <select
                value={newClass.schoolId}
                onChange={(e) => setNewClass({ ...newClass, schoolId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectSchool')}</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
              
              <select
                value={newClass.grade}
                onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectGrade')}</option>
                {VALID_GRADES.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder={t('section')}
                value={newClass.section}
                onChange={(e) => setNewClass({ ...newClass, section: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-gray-300 rounded"
                maxLength={2}
                required
              />

              <select
                value={newClass.shift}
                onChange={(e) => setNewClass({ ...newClass, shift: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectShift')}</option>
                {VALID_SHIFTS.map((shift) => (
                  <option key={shift} value={shift}>{t(`shifts.${shift}`)}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {tCommon('add')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded">
                  {tCommon('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('editClass')}</h2>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <select
                value={editingClass.grade}
                onChange={(e) => setEditingClass({ ...editingClass, grade: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectGrade')}</option>
                {VALID_GRADES.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder={t('section')}
                value={editingClass.section}
                onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-gray-300 rounded"
                maxLength={2}
                required
              />

              <select
                value={editingClass.shift}
                onChange={(e) => setEditingClass({ ...editingClass, shift: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">{t('selectShift')}</option>
                {VALID_SHIFTS.map((shift) => (
                  <option key={shift} value={shift}>{t(`shifts.${shift}`)}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {tCommon('save')}
                </button>
                <button type="button" onClick={() => setEditingClass(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded">
                  {tCommon('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deletingClassId} onOpenChange={(open) => !open && setDeletingClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{tCommon('deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-red-600 hover:bg-red-700">
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
