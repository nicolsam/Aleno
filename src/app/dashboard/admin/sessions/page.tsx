'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StudentsSkeleton from '@/components/skeletons/StudentsSkeleton'

interface Session {
  id: string
  userId: string
  teacher: { name: string; email: string }
  ipAddress: string | null
  userAgent: string | null
  lastActiveAt: string
  isActive: boolean
}

export default function AdminSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    const fetchSessions = async () => {
      const res = await fetch('/api/admin/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
      } else {
        router.push('/dashboard')
      }
      setLoading(false)
    }

    fetchSessions()
  }, [router])

  if (loading) return <StudentsSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline">&larr; Back to Admin</Link>
        <h1 className="text-2xl font-bold">Active Sessions</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-sm font-semibold text-gray-600">User</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Last Active</th>
              <th className="p-4 text-sm font-semibold text-gray-600">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-medium text-gray-800">{session.teacher.name}</p>
                  <p className="text-xs text-gray-500">{session.teacher.email}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${session.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {session.isActive ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(session.lastActiveAt).toLocaleString()}
                </td>
                <td className="p-4 text-sm text-gray-600 font-mono">
                  {session.ipAddress || 'Unknown'}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No sessions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
