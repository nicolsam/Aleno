'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AuditLog {
  id: string
  teacherId: string
  teacher: { name: string; email: string }
  action: string
  details: any
  ipAddress: string | null
  createdAt: string
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    const fetchLogs = async () => {
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
      } else {
        router.push('/dashboard')
      }
      setLoading(false)
    }

    fetchLogs()
  }, [router])

  if (loading) return <div className="p-8 text-gray-500">Loading audit logs...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin" className="text-blue-600 hover:underline">&larr; Back to Admin</Link>
        <h1 className="text-2xl font-bold">Global Audit Trail</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-sm font-semibold text-gray-600">Timestamp</th>
              <th className="p-4 text-sm font-semibold text-gray-600">User</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Action</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Details</th>
              <th className="p-4 text-sm font-semibold text-gray-600">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-600">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-4">
                  <p className="font-medium text-gray-800">{log.teacher.name}</p>
                  <p className="text-xs text-gray-500">{log.teacher.email}</p>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-600 font-mono max-w-xs truncate" title={JSON.stringify(log.details)}>
                  {JSON.stringify(log.details)}
                </td>
                <td className="p-4 text-sm text-gray-600 font-mono">
                  {log.ipAddress || 'Unknown'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No audit logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
