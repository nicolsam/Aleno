import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request)
    if (auth.error) return auth.error

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: { name: true, email: true }
        }
      },
      take: 200
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Admin logs error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
