'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface School {
  id: string
  name: string
  address?: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const locale = useLocale()
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
        const stored = localStorage.getItem('selectedSchool')
        if (stored && data.schools.find((s: School) => s.id === stored)) {
          setSelectedSchool(stored)
        } else if (data.schools.length > 0) {
          setSelectedSchool('') // Default to "All Schools" explicitly
        }
      }
    }
    fetchSchools()
  }, [mounted])

  // Broadcast school change to other components
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('selectedSchool', selectedSchool)
    window.dispatchEvent(new Event('schoolChanged'))
  }, [selectedSchool, mounted])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('teacher')
    localStorage.removeItem('selectedSchool')
    router.push('/login')
  }

  // Do not show filter on Schools page
  const showFilter = pathname !== '/dashboard/schools' && schools.length > 0

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-800 text-white min-h-screen relative">
        <div className="p-4">
          <h1 className="text-xl font-bold">Aleno</h1>
          {teacher && mounted && <p className="text-sm text-gray-300 mt-1">{teacher.name}</p>}
        </div>
        <nav className="mt-4">
          <a
            href="/dashboard"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard' ? 'bg-gray-700' : ''}`}
          >
            {t('dashboard')}
          </a>
          <a
            href="/dashboard/students"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard/students' ? 'bg-gray-700' : ''}`}
          >
            {t('students')}
          </a>
          <a
            href="/dashboard/schools"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard/schools' ? 'bg-gray-700' : ''}`}
          >
            {t('schools')}
          </a>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 flex flex-col gap-4">
          <LanguageSwitcher />
          <button onClick={handleLogout} className="text-left text-sm text-gray-300 hover:text-white">
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {!mounted ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {showFilter && (
              <div className="mb-6 flex items-center gap-4">
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{locale === 'en' ? 'All Schools' : 'Todas as Escolas'}</option>
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