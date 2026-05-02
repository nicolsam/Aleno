import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Touch User lastActiveAt
    await prisma.user.update({
      where: { id: payload.id },
      data: { lastActiveAt: new Date() }
    })

    // Touch UserSession lastActiveAt
    await prisma.userSession.updateMany({
      where: { token, userId: payload.id },
      data: { lastActiveAt: new Date() }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
