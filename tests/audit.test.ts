import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

const { mockCreateLog } = vi.hoisted(() => ({
  mockCreateLog: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: { create: mockCreateLog },
  },
}))

import { logAction } from '../src/lib/audit'

describe('Audit Library: logAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {}) // silence console.error
  })

  it('should create an audit log successfully', async () => {
    mockCreateLog.mockResolvedValue({ id: 'log-1' })

    await logAction('teacher-1', 'LOGIN', { test: true }, '127.0.0.1')

    expect(mockCreateLog).toHaveBeenCalledTimes(1)
    expect(mockCreateLog).toHaveBeenCalledWith({
      data: {
        userId: 'teacher-1',
        action: 'LOGIN',
        details: { test: true },
        ipAddress: '127.0.0.1',
      }
    })
  })

  it('should handle undefined details gracefully by passing null', async () => {
    mockCreateLog.mockResolvedValue({ id: 'log-2' })

    await logAction('teacher-2', 'LOGOUT')

    expect(mockCreateLog).toHaveBeenCalledTimes(1)
    expect(mockCreateLog).toHaveBeenCalledWith({
      data: {
        userId: 'teacher-2',
        action: 'LOGOUT',
        details: Prisma.JsonNull,
        ipAddress: undefined,
      }
    })
  })

  it('should catch database errors and log to console, avoiding crash', async () => {
    mockCreateLog.mockRejectedValue(new Error('DB connection lost'))

    // Should not throw
    await expect(logAction('teacher-3', 'CRASH')).resolves.toBeUndefined()
    
    expect(mockCreateLog).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith('Failed to write audit log:', expect.any(Error))
  })
})
