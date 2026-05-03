import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (isAuthFailure(auth)) return auth.error

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id, deletedAt: null },
      include: {
        class: true,
        school: { select: { id: true, name: true } },
      },
    })

    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!hasSchoolAccess(auth.user, student.schoolId)) return forbiddenResponse()

    const history = await prisma.studentReadingHistory.findMany({
      where: { studentId: id },
      orderBy: [
        { recordedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        readingLevel: true,
        user: { select: { name: true } },
      },
    })

    const commentaries = await prisma.studentCommentary.findMany({
      where: { studentId: id },
      orderBy: [
        { recordedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: { select: { name: true } },
      },
    })

    return NextResponse.json({
      student,
      history: history.map((entry) => ({ ...entry, teacher: entry.user })),
      commentaries: commentaries.map((entry: any) => ({ ...entry, teacher: entry.user })),
    })
  } catch (error) {
    console.error('Student history error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
