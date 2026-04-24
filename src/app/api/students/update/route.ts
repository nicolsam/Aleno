import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, readingLevelId, notes } = body

    if (!studentId || !readingLevelId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const history = await prisma.studentReadingHistory.create({
      data: {
        studentId,
        readingLevelId,
        teacherId: payload.id,
        notes,
      },
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Update reading level error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}