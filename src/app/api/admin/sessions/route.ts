import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request)
    if (auth.error) return auth.error

    const sessions = await prisma.userSession.findMany({
      orderBy: { lastActiveAt: 'desc' },
      include: {
        teacher: {
          select: { name: true, email: true }
        }
      },
      take: 100
    })

    // Map to identify which ones are currently active (< 5 min)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const formattedSessions = sessions.map(session => ({
      ...session,
      isActive: session.lastActiveAt >= fiveMinutesAgo
    }))

    return NextResponse.json({ sessions: formattedSessions })
  } catch (error) {
    console.error('Admin sessions error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
