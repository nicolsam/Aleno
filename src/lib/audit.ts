import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function logAction(userId: string, action: string, details?: unknown, ipAddress?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue : Prisma.JsonNull,
        ipAddress,
      }
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
