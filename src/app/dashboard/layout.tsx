'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface School {
  id: string
  name: string
  address?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [teacher, setTeacher] = useState<{ name: string; email: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const storedTeacher = localStorage.getItem('teacher')
    const token = localStorage.getItem('token')
    if (!storedTeacher || !token) {
      router.push('/login')
      return
    }
    setTeacher(JSON.parse(storedTeacher))
  }, [router, mounted])

  useEffect(() => {
    if (!mounted) return

    const fetchSchools = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/schools', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.schools) {
        setSchools(data.schools)
        if (data.schools.length > 0 && !selectedSchool) {
          setSelectedSchool(data.schools[0].id)
        }
      }
    }
    fetchSchools()
  }, [mounted])

  useEffect(() => {
    if (selectedSchool) {
      localStorage.setItem('selectedSchool', selectedSchool)
    }
  }, [selectedSchool])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('teacher')
    localStorage.removeItem('selectedSchool')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-800 text-white min-h-screen">
        <div className="p-4">
          <h1 className="text-xl font-bold">Aleno</h1>
          {teacher && mounted && <p className="text-sm text-gray-300 mt-1">{teacher.name}</p>}
        </div>
        <nav className="mt-4">
          <a
            href="/dashboard"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard' ? 'bg-gray-700' : ''}`}
          >
            Dashboard
          </a>
          <a
            href="/dashboard/students"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard/students' ? 'bg-gray-700' : ''}`}
          >
            Students
          </a>
          <a
            href="/dashboard/schools"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard/schools' ? 'bg-gray-700' : ''}`}
          >
            Schools
          </a>
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button onClick={handleLogout} className="text-sm text-gray-300 hover:text-white">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {!mounted ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-700">Loading...</p>
          </div>
        ) : (
          <>
            {schools.length > 0 && (
              <div className="mb-6 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">School:</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Schools</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {children}
          </>
        )}
      </main>
    </div>
  )
}