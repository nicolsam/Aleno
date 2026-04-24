'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [levels, setLevels] = useState<ReadingLevel[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [newStudent, setNewStudent] = useState({ name: '', studentNumber: '' })
  const [updateLevel, setUpdateLevel] = useState({ studentId: '', readingLevelId: '', notes: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const stored = localStorage.getItem('selectedSchool')
    setSchoolId(stored || '')
  }, [router])

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token || !schoolId) return

      const res = await fetch(`/api/students?schoolId=${schoolId}`, {
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
    if (!token || !schoolId) {
      setError('Please select a school first')
      return
    }

    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newStudent, schoolId }),
    })

    if (res.ok) {
      const data = await res.json()
      setStudents([...students, data.student])
      setShowModal(false)
      setNewStudent({ name: '', studentNumber: '' })
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create student')
    }
  }

  const handleUpdateLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    console.log('Sending update:', updateLevel) // Debug log

    if (!updateLevel.readingLevelId) {
      setError('Please select a reading level')
      return
    }

    const res = await fetch('/api/students/update', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updateLevel),
    })

    console.log('Response status:', res.status) // Debug log

    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json()
      console.log('Error response:', data) // Debug log
      setError(data.error || 'Failed to update reading level')
    }
  }

  if (loading) {
    return <div className="text-gray-700">Loading...</div>
  }

  if (!schoolId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700 mb-4">You need to create a school first.</p>
        <a
          href="/dashboard/schools"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          Create a School
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Student
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Student #</th>
              <th className="text-left p-4">Current Level</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-700">
                  No students yet. Add your first student.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="p-4">{student.name}</td>
                  <td className="p-4">{student.studentNumber}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        ['DNI', 'LO'].includes(student.readingHistory[0]?.readingLevel.code)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {student.readingHistory[0]?.readingLevel.name || 'Not assessed'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setUpdateLevel({ studentId: student.id, readingLevelId: '', notes: '' })
                      }}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Update Level
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
            <h2 className="text-xl font-bold mb-4">Add Student</h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <input
                type="text"
                placeholder="Student name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                placeholder="Student number"
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
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updateLevel.studentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Update Reading Level</h2>
            <form onSubmit={handleUpdateLevel} className="space-y-4">
              <select
                value={updateLevel.readingLevelId}
                onChange={(e) => setUpdateLevel({ ...updateLevel, readingLevelId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="">Select level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name} ({level.code})
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notes (optional)"
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
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateLevel({ studentId: '', readingLevelId: '', notes: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}