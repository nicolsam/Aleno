'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface School {
  id: string
  name: string
  address?: string
}

export default function SchoolsPage() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newSchool, setNewSchool] = useState({ name: '', address: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchSchools = async () => {
      const res = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.schools) {
        setSchools(data.schools)
      }
      setLoading(false)
    }
    fetchSchools()
  }, [router])

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    const res = await fetch('/api/schools', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchool),
    })

    if (res.ok) {
      const data = await res.json()
      setSchools([...schools, data.school])
      setShowModal(false)
      setNewSchool({ name: '', address: '' })
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schools</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500 col-span-full">
            No schools yet. Add your first school.
          </div>
        ) : (
          schools.map((school) => (
            <div key={school.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold">{school.name}</h3>
              <p className="text-gray-500 text-sm">{school.address || 'No address'}</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add School</h2>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <input
                type="text"
                placeholder="School name"
                value={newSchool.name}
                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={newSchool.address}
                onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
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
    </div>
  )
}