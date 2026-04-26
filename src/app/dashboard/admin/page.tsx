'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminStats {
  totalSchools: number
  totalStudents: number
  totalAssessments: number
  activeSessions: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchStats = async () => {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      } else if (res.status === 403) {
        router.push('/dashboard')
      }
      setLoading(false)
    }

    fetchStats()
  }, [router])

  if (loading) return <div className="p-8 text-gray-500">Loading admin dashboard...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Active Sessions</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.activeSessions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Schools</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalSchools}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Students</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Assessments</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalAssessments}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow flex flex-col items-start gap-4">
          <h2 className="text-lg font-bold">Session Monitor</h2>
          <p className="text-gray-600 text-sm">View currently logged in users, their IP addresses, and when they were last active.</p>
          <Link href="/dashboard/admin/sessions" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Sessions
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex flex-col items-start gap-4">
          <h2 className="text-lg font-bold">Global Audit Trail</h2>
          <p className="text-gray-600 text-sm">Track all mutating actions across the entire platform. See who did what and when.</p>
          <Link href="/dashboard/admin/logs" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            View Audit Logs
          </Link>
        </div>
      </div>
    </div>
  )
}
