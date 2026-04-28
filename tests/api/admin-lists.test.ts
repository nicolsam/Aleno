import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const {
  mockVerifyAdmin,
  mockFindLogs,
  mockFindSessions,
} = vi.hoisted(() => ({
  mockVerifyAdmin: vi.fn(),
  mockFindLogs: vi.fn(),
  mockFindSessions: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  verifyAdmin: mockVerifyAdmin,
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: { findMany: mockFindLogs },
    userSession: { findMany: mockFindSessions },
  },
}))

import { GET as getAdminLogs } from '@/app/api/admin/logs/route'
import { GET as getAdminSessions } from '@/app/api/admin/sessions/route'

describe('Admin list APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockVerifyAdmin.mockResolvedValue({ payload: { id: 'admin-1' } })
  })

  it('returns audit logs for admins', async () => {
    const logs = [{ id: 'log-1', action: 'LOGIN', teacher: { name: 'Admin', email: 'admin@test.com' } }]
    mockFindLogs.mockResolvedValue(logs)

    const response = await getAdminLogs(new Request('http://localhost/api/admin/logs'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.logs).toEqual(logs)
    expect(mockFindLogs).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { name: true, email: true } } },
      take: 200,
    })
  })

  it('returns verifyAdmin errors for audit logs', async () => {
    mockVerifyAdmin.mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) })

    const response = await getAdminLogs(new Request('http://localhost/api/admin/logs'))

    expect(response.status).toBe(403)
    expect(mockFindLogs).not.toHaveBeenCalled()
  })

  it('returns sessions with active status', async () => {
    const now = new Date()
    const old = new Date(Date.now() - 10 * 60 * 1000)
    mockFindSessions.mockResolvedValue([
      { id: 'session-1', lastActiveAt: now, teacher: { name: 'Admin', email: 'admin@test.com' } },
      { id: 'session-2', lastActiveAt: old, teacher: { name: 'User', email: 'user@test.com' } },
    ])

    const response = await getAdminSessions(new Request('http://localhost/api/admin/sessions'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.sessions[0].isActive).toBe(true)
    expect(data.sessions[1].isActive).toBe(false)
    expect(mockFindSessions).toHaveBeenCalledWith({
      orderBy: { lastActiveAt: 'desc' },
      include: { teacher: { select: { name: true, email: true } } },
      take: 100,
    })
  })

  it('returns 500 when session lookup fails', async () => {
    mockFindSessions.mockRejectedValue(new Error('DB failed'))

    const response = await getAdminSessions(new Request('http://localhost/api/admin/sessions'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal error')
  })
})
