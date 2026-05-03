import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAction } from '@/lib/audit'
import { normalizeStudentContactInput } from '@/lib/student-contacts'
import { forbiddenResponse, hasSchoolAccess, isAuthFailure, requireAuth } from '@/lib/permissions'

async function getAccessibleContact(request: Request, studentId: string, contactId: string) {
  const auth = await requireAuth(request)
  if (isAuthFailure(auth)) return { response: auth.error }

  const contact = await prisma.studentContact.findFirst({
    where: { id: contactId, studentId },
    include: { student: { select: { id: true, schoolId: true } } },
  })
  if (!contact) return { response: NextResponse.json({ error: 'Contact not found' }, { status: 404 }) }
  if (!hasSchoolAccess(auth.user, contact.student.schoolId)) return { response: forbiddenResponse() }

  return { auth, contact }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id, contactId } = await params
    const access = await getAccessibleContact(request, id, contactId)
    if (access.response) return access.response

    const input = normalizeStudentContactInput(await request.json())
    if (input.isPrimary) {
      await prisma.studentContact.updateMany({ where: { studentId: id }, data: { isPrimary: false } })
    }

    const contact = await prisma.studentContact.update({
      where: { id: contactId },
      data: {
        name: input.name,
        relationship: input.relationship,
        phone: input.phone,
        whatsappPhone: input.whatsappPhone,
        isPrimary: input.isPrimary,
      },
    })

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'UPDATE_STUDENT_CONTACT', { studentId: id, contactId }, ipAddress)

    return NextResponse.json({ contact })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Student contact PUT error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id, contactId } = await params
    const access = await getAccessibleContact(request, id, contactId)
    if (access.response) return access.response

    const wasPrimary = access.contact!.isPrimary
    await prisma.studentContact.delete({ where: { id: contactId } })

    if (wasPrimary) {
      const nextContact = await prisma.studentContact.findFirst({ where: { studentId: id }, orderBy: { createdAt: 'asc' } })
      if (nextContact) await prisma.studentContact.update({ where: { id: nextContact.id }, data: { isPrimary: true } })
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await logAction(access.auth!.user.id, 'DELETE_STUDENT_CONTACT', { studentId: id, contactId }, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Student contact DELETE error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
