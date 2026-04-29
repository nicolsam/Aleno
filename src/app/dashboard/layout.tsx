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
  const [teacher, setTeacher] = useState<{ name: string; email: string; isGlobalAdmin?: boolean } | null>(null)
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

    // Heartbeat mechanism to keep session active
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (e) {
        console.error('Heartbeat failed', e)
      }
    }

    sendHeartbeat() // Send immediately on mount
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000) // Then every 2 minutes

    return () => clearInterval(interval)
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



  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-800 text-white h-screen sticky top-0 flex flex-col flex-shrink-0">
        <div className="p-4">
          <h1 className="text-xl font-bold">Aleno</h1>
          {teacher && mounted && <p className="text-sm text-gray-300 mt-1">{teacher.name}</p>}
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto custom-scrollbar">
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
            href="/dashboard/classes"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard/classes' ? 'bg-gray-700' : ''}`}
          >
            {t('classes')}
          </a>
          <a
            href="/dashboard/schools"
            className={`block px-4 py-2 hover:bg-gray-700 ${pathname === '/dashboard/schools' ? 'bg-gray-700' : ''}`}
          >
            {t('schools')}
          </a>
          {teacher?.isGlobalAdmin && (
            <a
              href="/dashboard/admin"
              className={`block px-4 py-2 hover:bg-gray-700 text-yellow-400 ${pathname.startsWith('/dashboard/admin') ? 'bg-gray-700' : ''}`}
            >
              Admin Panel
            </a>
          )}
        </nav>
        <div className="p-4 flex flex-col gap-4 border-t border-gray-700">
          <LanguageSwitcher />
          <button onClick={handleLogout} className="text-left text-sm text-gray-300 hover:text-white">
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
