import { prisma } from '@/lib/db'

export async function logAction(teacherId: string, action: string, details?: any, ipAddress?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        teacherId,
        action,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        ipAddress,
      }
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
