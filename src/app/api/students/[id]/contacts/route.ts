import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { normalizeStudentContactInput } from '@/lib/student-contacts'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'

async function getAccessibleStudent(request: Request, studentId: string) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }

  const student = await prisma.student.findUnique({
    where: { id: studentId, deletedAt: null },
    select: { id: true, schoolId: true },
  })
  if (!student) return { response: NextResponse.json({ error: 'Student not found' }, { status: 404 }) }
  if (!hasSchoolAccess(auth.user, student.schoolId)) return { response: forbiddenResponse() }

  return { auth, student }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await getAccessibleStudent(request, id)
    if (access.response) return access.response

    const contacts = await prisma.studentContact.findMany({
      where: { studentId: id },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Student contacts GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const access = await getAccessibleStudent(request, id)
    if (access.response) return access.response

    const input = normalizeStudentContactInput(await request.json())
    const contactCount = await prisma.studentContact.count({ where: { studentId: id } })
    const isPrimary = input.isPrimary || contactCount === 0

    if (isPrimary) {
      await prisma.studentContact.updateMany({ where: { studentId: id }, data: { isPrimary: false } })
    }

    const contact = await prisma.studentContact.create({
      data: {
        studentId: id,
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        whatsappPhone: input.whatsappPhone,
        isPrimary,
      },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'CREATE_STUDENT_CONTACT', { studentId: id, contactId: contact.id }, ipAddress)

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Student contacts POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
