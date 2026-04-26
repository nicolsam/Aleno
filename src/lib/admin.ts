import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function verifyAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: payload.id } })
  if (!teacher || !teacher.isGlobalAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { payload, teacher }
}
